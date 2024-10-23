// utils/api.ts
import axios from "axios";

const OPENCAGE_API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

// Function to get geocode suggestions from OpenCage API
export const getGeocodeSuggestions = async (query: string) => {
	try {
		const response = await axios.get(
			`https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
				query
			)}&key=${OPENCAGE_API_KEY}&limit=5`
		);
		return response.data.results; // Returns location results from OpenCage
	} catch (error) {
		console.error("Error fetching location suggestions:", error);
		return [];
	}
};
