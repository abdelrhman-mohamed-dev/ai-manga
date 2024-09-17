const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
const port = 3000;

// Base URLs for the manga sites
const BASE_URLS = {
  teamx: "https://teamoney.site",
  mangalek: "https://lekmanga.net", // Adjust as needed
};

// Helper function to get manga details for teamx
async function getMangaDetailsTeamx(mangaUrl) {
  try {
    const response = await axios.get(mangaUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    const description = $("div.review-content p").text().trim();
    const genre = $("div.review-author-info a")
      .map((i, el) => $(el).text().trim())
      .get();

    return {
      description: description || "No description available",
      genre: genre.length > 0 ? genre : ["No genre available"],
    };
  } catch (error) {
    console.error("Error fetching manga details from teamx:", error.message);
    return {
      description: "No description available",
      genre: ["No genre available"],
    };
  }
}
// Helper function to get popular manga data for teamx
async function getPopularMangaTeamx(page = 1) {
  try {
    const response = await axios.get(
      `${BASE_URLS.teamx}/series/${page > 1 ? `?page=${page}` : ""}`
    );
    const html = response.data;
    const $ = cheerio.load(html);

    const mangaElements = $("div.listupd div.bsx");
    const mangaList = await Promise.all(
      mangaElements
        .map(async (i, element) => {
          const title = $(element).find("a").attr("title");
          const url = $(element).find("a").attr("href");
          const fullUrl = `${url}`;
          const thumbnailUrl =
            $(element).find("img").attr("data-src") ||
            $(element).find("img").attr("src");

          const { description, genre } = await getMangaDetailsTeamx(fullUrl);

          return {
            title,
            url: fullUrl,
            thumbnailUrl,
            description,
            genre,
          };
        })
        .get()
    );

    return mangaList;
  } catch (error) {
    console.error("Error fetching popular manga from teamx:", error.message);
    return [];
  }
}

// Helper function to get manga details for mangalek
async function getMangaDetailsMangalek(mangaUrl) {
  try {
    const response = await axios.get(mangaUrl);
    const html = response.data;
    const $ = cheerio.load(html);

    // Adjust selectors based on actual HTML structure
    const description = $("div.description p").text().trim();
    const genre = $("div.genre a")
      .map((i, el) => $(el).text().trim())
      .get();

    return {
      description: description || "No description available",
      genre: genre.length > 0 ? genre : ["No genre available"],
    };
  } catch (error) {
    console.error("Error fetching manga details from mangalek:", error.message);
    return {
      description: "No description available",
      genre: ["No genre available"],
    };
  }
}

// Helper function to get popular manga data for mangalek
async function getPopularMangaMangalek(page = 1) {
  try {
    //?action=wp-manga-search-manga&page=${page}
    const url = `${BASE_URLS.mangalek}/wp-admin/admin-ajax.php`;
    console.log(`Fetching data from: ${url}`); // Log the URL for debugging
    const html = response.data;
    const $ = cheerio.load(html);

    console.log(html);
    // Update selector to match actual HTML
    const mangaElements = $("div.manga-item"); // Adjust selector if necessary
    const mangaList = await Promise.all(
      mangaElements
        .map(async (i, element) => {
          const title = $(element).find("h3 a").text().trim();
          const url = $(element).find("h3 a").attr("href");
          const fullUrl = url;
          const thumbnailUrl = $(element).find("img").attr("src");

          const { description, genre } = await getMangaDetailsMangalek(fullUrl);

          return {
            title,
            url: fullUrl,
            thumbnailUrl,
            description,
            genre,
          };
        })
        .get()
    );

    return mangaList;
  } catch (error) {
    console.error("Error fetching popular manga from mangalek:", error.message);
    return [];
  }
}

// Route to get popular manga with description and genre
app.get("/api/popular-manga", async (req, res) => {
  const page = req.query.page || 1;
  const site = req.query.site || "teamx"; // Default to teamx if no query param is provided

  let popularManga = [];
  if (site === "teamx") {
    popularManga = await getPopularMangaTeamx(page);
  } else if (site === "mangalek") {
    popularManga = await getPopularMangaMangalek(page);
  } else {
    return res.status(400).json({ error: "Invalid site parameter" });
  }

  res.json(popularManga);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
