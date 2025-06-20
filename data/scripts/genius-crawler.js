import axios from 'axios';
import * as cheerio from 'cheerio'
import dotenv from 'dotenv';

dotenv.config();

const baseUrl = 'https://api.genius.com';

export async function searchLyrics(title, artist) {
    try {
        const searchUrl = `${baseUrl}/search?q=${encodeURIComponent(`${title} ${artist}`)}`
        const searchResponse = await axios.get(searchUrl, {
            headers: {
                Authorization: `Bearer ${process.env.GENIUS_CLIENT_ACCESS_TOKEN}`
            }
        })
        if (searchResponse.data.response.hits.length === 0) {
            console.log(`No results found for ${title} by ${artist}`);
            return;
        }
        const songURL = searchResponse.data.response.hits[0].result.url;

        const songResponse = await axios.get(songURL);

        const $ = cheerio.load(songResponse.data);

        const lyrics = $('[data-lyrics-container="true"]')
            .map((i, container) => {
                const $container = $(container).clone();
                $container.find('[data-exclude-from-selection="true"]').remove();
                
                return $container.html()
                    .replace(/<br\s*\/?>/gi, '\n') // removes line breaks
                    .replace(/<[^>]*>/g, '') // removes tags
                    .replace(/&amp;/g, '&') // decodes ampersands
                    .replace(/\[(Intro|Verse|Chorus|Bridge|Outro|Pre-Chorus)[^\]]*\]/gi, '\n') // removes section labels
                    .replace(/\n\s*\n/g, '\n') // removes extra newlines
                    .trim();
            })
            .get()
            .join('\n\n');

        if (lyrics) {
            console.log(`\nLyrics for ${title} by ${artist}:\n${lyrics}`);
        } else {
            console.log(`Lyrics not found for ${title} by ${artist}`);
        }

        return lyrics;
    } catch (error) {
        console.error(`Error fetching lyrics for ${title} by ${artist}: ${error.message}`);
    }
}

searchLyrics("juju on that beat", "zayion mccall");