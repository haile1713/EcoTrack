"use client";

import { useState, useEffect, useCallback } from "react";

import { MapPin, Upload, CheckCircle, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";

import { GoogleGenerativeAI } from "@google/generative-ai";

import { StandaloneSearchBox, useJsApiLoader } from "@react-google-maps/api";

import { Libraries } from "@react-google-maps/api";

import { useRouter } from "next/navigation";

import { toast } from "react-hot-toast";
