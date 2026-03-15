const express = require('express');
const axios = require('axios');
const { appendLeadsToSheet } = require('../services/googleSheets');
const router = express.Router();

// A tiny helper to pause between Google requests so we don't get blocked
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

router.post('/search', async (req, res) => {
  const { category, city } = req.body;

  if (!category || !city) {
    return res.status(400).json({ error: 'Category and city are required' });
  }

  const query = `${category} in ${city}`;
  let allLeads = [];
  let nextPageToken = null;
  let pageCount = 0;
  const MAX_PAGES = 15; // Max 300 businesses checked per search to protect your API limits
  let totalPlacesChecked = 0;

  try {
    // Keep looping until we find 50 leads OR run out of pages
    do {
      const requestBody = {
        textQuery: query,
        pageSize: 20
      };

      // If we have a next page token from the last loop, use it!
      if (nextPageToken) {
        requestBody.pageToken = nextPageToken;
        await sleep(2000); // Google requires a 2-second pause before using a next page token
      }

      const response = await axios.post(
        'https://places.googleapis.com/v1/places:searchText',
        requestBody,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
            // Notice we added 'nextPageToken' to the FieldMask so Google gives us the key to the next page
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.rating,places.websiteUri,places.primaryType,nextPageToken'
          }
        }
      );

      const places = response.data.places || [];
      totalPlacesChecked += places.length;

      const newLeads = places
        .filter(place => !place.websiteUri) // Only those WITHOUT websites
        .map(place => ({
          id: place.id,
          name: place.displayName?.text || 'Unknown',
          address: place.formattedAddress || 'No address',
          phone: place.nationalPhoneNumber || 'No phone',
          rating: place.rating || 'No rating',
          category: place.primaryType || category,
          hasWebsite: false
        }));

      allLeads = allLeads.concat(newLeads);
      nextPageToken = response.data.nextPageToken;
      pageCount++;

      console.log(`Page ${pageCount} checked. Found ${newLeads.length} leads this page. Total so far: ${allLeads.length}`);

    } while (allLeads.length < 50 && nextPageToken && pageCount < MAX_PAGES);

    // Save ALL found leads to Google Sheets!
    if (allLeads.length > 0) {
      await appendLeadsToSheet(allLeads, category, city);
    }

    res.json({
      success: true,
      pagesChecked: pageCount,
      totalPlacesChecked: totalPlacesChecked,
      leadsFound: allLeads.length,
      leads: allLeads
    });

  } catch (error) {
    console.error('Error fetching places:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

module.exports = router;