"use client";

import { useState, useEffect, useCallback } from "react";

import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";

import { Libraries } from "@react-google-maps/api";

import { useRouter } from "next/navigation";

import { toast } from "react-hot-toast";
import { promises } from "dns";
import { parseArgs } from "util";

const geminiApiKey = process.env.GEMINI_API_KEY as any;
const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY as any;

const libraries: Libraries = ["places"];

export default function ReportPage() {
	const [user, serUser] = useState("");
	const router = useRouter();

	const [reports, setReports] = useState<
		Array<{
			ide: number;
			location: string;
			wasteType: string;
			amount: string;
			createdAt: string;
		}>
	>([]);

	const [newReport, setNewReport] = useState({
		location: "",
		type: "",
		amount: "",
	});

	const [file, setFile] = useState<File | null>(null);
	const [preview, setPreview] = useState<string | null>(null);

	const [verficationStatus, setVerificationStatus] = useState<
		"idle" | "verfiying" | "success" | "failure"
	>("idle");

	const [verificationResults, setVerificationResults] = useState<{
		wasteType: number;
		quantity: string;
		confidence: string;
	} | null>(null);

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [searchBox, setSearchBox] =
		useState<google.maps.places.SearchBox | null>(null);

	const { isLoaded } = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: googleMapsApiKey,
		libraries: libraries,
	});

	const onLoad = useCallback((ref: google.maps.places.SearchBox) => {
		setSearchBox(ref);
	}, []);

	const onPlaceChanged = () => {
		if (searchBox) {
			const places = searchBox.getPlaces();
			if (places && places.length > 0) {
				const place = places[0];
				setNewReport((prev) => ({
					...prev,
					location: place.formatted_address || "",
				}));
			}
		}
	};

	//gemini implementation

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
	) => {
		const { name, value } = e.target;
		setNewReport({ ...newReport, [name]: value });
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const selectedFile = e.target.files[0];
			setFile(selectedFile);

			const reader = new FileReader();
			reader.onload = (e) => {
				setPreview(e.target?.result as string);
			};
			reader.readAsDataURL(selectedFile);
		}
	};

	const readFileAsBase64 = (file: File): Promise<string> => {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => resolve(reader.result as string);
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	};

	//waste verfication using gemini

	const handleVerify = async () => {
		if (!file) return;

		setVerificationStatus("verfiying");

		try {
			const genAI = new GoogleGenerativeAI(geminiApiKey);
			const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
			const base64Data = await readFileAsBase64(file);

			const imageParts = [
				{
					inlineData: {
						data: base64Data.split(",")[1],
						mimeType: file.type,
					},
				},
			];

			const prompt = `You are an expert in waste management and recycling. Analyze this image and provide:
            1. The type of waste (e.g., plastic, paper, glass, metal, organic)
            2. An estimate of the quantity or amount (in kg or liters)
            3. Your confidence level in this assessment (as a percentage)
            
            Respond in JSON format like this:
            {
              "wasteType": "type of waste",
              "quantity": "estimated quantity with unit",
              "confidence": confidence level as a number between 0 and 1
            }`;

			const result = await model.generateContent([prompt, ...imageParts]);
			const response = await result.response;
			const text = response.text();

			try {
				const parsedResult = JSON.parse(text);
				if (
					parsedResult.wasteType &&
					parsedResult.quantity &&
					parsedResult.confidence
				) {
					setVerificationResults(parsedResult);
					setVerificationStatus("success");
					setNewReport({
						...newReport,
						type: parsedResult.wasteType,
						amount: parsedResult.quantity,
					});
				} else {
					console.error("Invalid verification result:", parsedResult);
					setVerificationStatus("failure");
				}
			} catch (error) {
				console.error("Failed to parse JSON response:", text);
				setVerificationStatus("failure");
			}
		} catch (error) {
			console.error("Error verifying waste:", error);
			setVerificationStatus("failure");
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (verficationStatus !== "success" || !user) {
			toast.error("please verify the waste before submitting or log in");
            return;
		}

        setIsSubmitting (true);

        try{
            // const report = await createReport() as any;

        }catch (e){

        }
	};
}
