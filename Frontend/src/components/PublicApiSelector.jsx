import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Key, FileText, Info } from 'lucide-react';

const PUBLIC_APIS = [
    {
        id: 'anthropic',
        name: 'Anthropic',
        category: 'AI',
        description: 'AI language models and chat completions',
        docs_url: 'https://docs.anthropic.com/claude/reference',
        demo_key: null, // Will be fetched securely from backend
        sample_doc: `{
  "openapi": "3.0.0",
  "info": {
    "title": "Anthropic API",
    "version": "1.0.0"
  },
  "paths": {
    "/v1/messages": {
      "post": {
        "summary": "Create message completion",
        "parameters": [],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "model": { "type": "string", "example": "claude-sonnet-4-5-20250929" },
                  "max_tokens": { "type": "integer", "example": 1000 },
                  "messages": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "role": { "type": "string" },
                        "content": { "type": "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`
    },
    {
        id: 'openweather',
        name: 'OpenWeatherMap',
        category: 'Weather',
        description: 'Weather data and forecasts',
        docs_url: 'https://openweathermap.org/api',
        demo_key: 'YOUR_API_KEY', // Will be replaced securely from backend
        sample_doc: `{
  "openapi": "3.0.0",
  "info": {
    "title": "OpenWeatherMap API",
    "version": "2.5"
  },
  "paths": {
    "/weather": {
      "get": {
        "summary": "Get current weather",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "City name"
          },
          {
            "name": "appid",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "API key"
          },
          {
            "name": "units",
            "in": "query",
            "schema": { "type": "string", "enum": ["metric", "imperial", "kelvin"] },
            "description": "Units of measurement"
          }
        ]
      }
    },
    "/forecast": {
      "get": {
        "summary": "Get 5-day weather forecast",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "City name"
          },
          {
            "name": "appid",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "API key"
          },
          {
            "name": "units",
            "in": "query",
            "schema": { "type": "string", "enum": ["metric", "imperial", "kelvin"] },
            "description": "Units of measurement"
          }
        ]
      }
    }
  }
}`
    },
    {
        id: 'coingecko',
        name: 'CoinGecko',
        category: 'Crypto',
        description: 'Cryptocurrency prices and market data',
        docs_url: 'https://www.coingecko.com/en/api/documentation',
        demo_key: null,
        sample_doc: `{
  "openapi": "3.0.0",
  "info": {
    "title": "CoinGecko API",
    "version": "3.0"
  },
  "paths": {
    "/simple/price": {
      "get": {
        "summary": "Get cryptocurrency prices",
        "parameters": [
          {
            "name": "ids",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "Cryptocurrency IDs (comma-separated)"
          },
          {
            "name": "vs_currencies",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "Target currencies (comma-separated)"
          }
        ]
      }
    }
  }
}`
    },
    {
        id: 'exchangerate',
        name: 'ExchangeRate-API',
        category: 'Finance',
        description: 'Currency exchange rates',
        docs_url: 'https://www.exchangerate-api.com/docs',
        demo_key: null,
        sample_doc: `{
  "openapi": "3.0.0",
  "info": {
    "title": "ExchangeRate API",
    "version": "6.0"
  },
  "paths": {
    "/latest/{base_currency}": {
      "get": {
        "summary": "Get latest exchange rates",
        "parameters": [
          {
            "name": "base_currency",
            "in": "path",
            "required": true,
            "schema": { "type": "string" },
            "description": "Base currency code (e.g., USD, EUR)"
          }
        ]
      }
    }
  }
}`
    },
    {
        id: 'googlebooks',
        name: 'Google Books',
        category: 'Books',
        description: 'Search and get book information',
        docs_url: 'https://developers.google.com/books/docs/v1/using',
        demo_key: null,
        sample_doc: `{
  "openapi": "3.0.0",
  "info": {
    "title": "Google Books API",
    "version": "1.0"
  },
  "paths": {
    "/volumes": {
      "get": {
        "summary": "Search for books",
        "parameters": [
          {
            "name": "q",
            "in": "query",
            "required": true,
            "schema": { "type": "string" },
            "description": "Search query"
          },
          {
            "name": "maxResults",
            "in": "query",
            "schema": { "type": "integer", "maximum": 40 },
            "description": "Maximum number of results"
          }
        ]
      }
    }
  }
}`
    },
    {
        id: 'tbo',
        name: 'TBO Holidays',
        category: 'Travel',
        description: 'Hotel booking and travel services',
        docs_url: 'http://api.tbotechnology.in/TBOHolidays_HotelAPI',
        demo_key: 'demo-tbo-key-replace-with-actual',
        sample_doc: `openapi: 3.0.3
info:
  title: TBO Holidays Hotel API (Staging)
  version: "1.0"
servers:
  - url: http://api.tbotechnology.in/TBOHolidays_HotelAPI
components:
  securitySchemes:
    basicAuth:
      type: http
      scheme: basic
  schemas:
    PaxRoom:
      type: object
      properties:
        Adults: { type: integer, example: 2 }
        Children: { type: integer, example: 0 }
        ChildrenAges:
          type: array
          items: { type: integer }
          example: []
      required: [Adults, Children, ChildrenAges]
    SearchRequest:
      type: object
      properties:
        CheckIn:   { type: string, format: date, example: "2025-10-09" }
        CheckOut:  { type: string, format: date, example: "2025-10-10" }
        GuestNationality: { type: string, example: "AE" }
        HotelCodes: { type: string, example: "1402689,1405349,1405355" }
        PaxRooms:
          type: array
          items: { $ref: "#/components/schemas/PaxRoom" }
        ResponseTime: { type: integer, example: 20 }
        IsDetailedResponse: { type: boolean, example: true }
        Filters:
          type: object
          properties:
            Refundable: { type: boolean, example: true }
            NoOfRooms:  { type: integer, example: 0 }
            MealType:   { type: string, example: "All" }
      required: [CheckIn, CheckOut, GuestNationality, PaxRooms]
    PreBookRequest:
      type: object
      properties:
        BookingCode: { type: string, example: "1407362!TB!1!TB!964e0fed-4fe7-4eee-82c7-d00e04d64728" }
        PaymentMode: { type: string, example: "Limit" }
      required: [BookingCode, PaymentMode]
    BookRequest:
      type: object
      properties:
        BookingCode: { type: string }
        CustomerDetails:
          type: array
          items:
            type: object
            properties:
              CustomerNames:
                type: array
                items:
                  type: object
                  properties:
                    Title: { type: string, example: "Mr" }
                    FirstName: { type: string }
                    LastName: { type: string }
                    Type: { type: string, example: "Adult" }
        ClientReferenceId: { type: string, example: "2022081001" }
        BookingReferenceId: { type: string, example: "2022081001" }
        TotalFare: { type: number, example: 1222.09 }
        EmailId: { type: string, format: email }
        PhoneNumber: { type: string }
        BookingType: { type: string, example: "Voucher" }
        PaymentMode: { type: string, example: "Limit" }
        PaymentInfo:
          type: object
          properties:
            CvvNumber: { type: string, example: "123" }
            CardNumber: { type: string, example: "5555555555554444" }
            CardExpirationMonth: { type: string, example: "12" }
            CardExpirationYear: { type: string, example: "2026" }
            CardHolderFirstName: { type: string, example: "John" }
            CardHolderlastName: { type: string, example: "Doe" }
            BillingAmount: { type: number, example: 1627.872 }
            BillingCurrency: { type: string, example: "AED" }
            CardHolderAddress:
              type: object
              properties:
                AddressLine1: { type: string }
                AddressLine2: { type: string }
                City: { type: string }
                PostalCode: { type: string }
                CountryCode: { type: string, example: "AE" }
      required: [BookingCode, CustomerDetails, BookingType, PaymentMode]
    CityListRequest:
      type: object
      properties:
        CountryCode: { type: string, example: "AE" }
      required: [CountryCode]
    BookingDetailRequest:
      type: object
      properties:
        BookingReferenceId: { type: string, example: "2022081001" }
        PaymentMode: { type: string, example: "Limit" }
      required: [BookingReferenceId, PaymentMode]
    BookingDetailsByDateRequest:
      type: object
      properties:
        FromDate: { type: string, example: "2025-10-01T00:00:00Z", description: "ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)" }
        ToDate:   { type: string, example: "2025-10-08T23:59:59Z", description: "ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)" }
      required: [FromDate, ToDate]
    HotelDetailsRequest:
      type: object
      properties:
        Hotelcodes: { type: string, example: "1033928" }
        Language: { type: string, example: "en" }
      required: [Hotelcodes]
security:
  - basicAuth: []
paths:
  /search:
    post:
      summary: Search hotels
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/SearchRequest" }
            examples:
              sample:
                value:
                  CheckIn: "2025-10-09"
                  CheckOut: "2025-10-10"
                  GuestNationality: "AE"
                  HotelCodes: "1402689,1405349,1405355"
                  PaxRooms: [ { Adults: 1, Children: 0, ChildrenAges: [] } ]
                  ResponseTime: 20
                  IsDetailedResponse: true
                  Filters: { Refundable: true, NoOfRooms: 0, MealType: "All" }
      responses:
        "200": { description: OK }
        "400": { description: Invalid date format }
  /PreBook:
    post:
      summary: Pre-book a room
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/PreBookRequest" }
      responses:
        "200": { description: OK }
  /Book:
    post:
      summary: Confirm booking
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/BookRequest" }
      responses:
        "200": { description: OK }
  /CityList:
    post:
      summary: List cities by country
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/CityListRequest" }
      responses:
        "200": { description: OK }
  /CountryList:
    get:
      summary: List countries
      security: [{ basicAuth: [] }]
      responses:
        "200": { description: OK }
  /BookingDetail:
    post:
      summary: Get booking detail
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/BookingDetailRequest" }
      responses:
        "200": { description: OK }
  /BookingDetailsBasedOnDate:
    post:
      summary: Get bookings by date range
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/BookingDetailsByDateRequest" }
            examples:
              week:
                value:
                  FromDate: "2025-10-01T00:00:00Z"
                  ToDate:   "2025-10-08T23:59:59Z"
      responses:
        "200": { description: OK }
  /Hoteldetails:
    post:
      summary: Hotel details by code
      security: [{ basicAuth: [] }]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/HotelDetailsRequest" }
      responses:
        "200": { description: OK }
  /hotelcodelist:
    get:
      summary: List hotel codes
      security: [{ basicAuth: [] }]
      responses:
        "200": { description: OK }`
    }
];

const CATEGORY_COLORS = {
    'AI': 'bg-purple-600',
    'Weather': 'bg-blue-600',
    'Crypto': 'bg-yellow-600',
    'Finance': 'bg-green-600',
    'Books': 'bg-orange-600',
    'Travel': 'bg-pink-600'
};

export default function PublicApiSelector({ onSelectApi, onClose, open }) {
    const [selectedApi, setSelectedApi] = useState(null);
    const [apiKeys, setApiKeys] = useState({});

    // Note: API keys should never be fetched to the frontend for security reasons
    // The backend will handle API keys internally when processing requests

    const handleSelectApi = async (api) => {
        let demoKey = api.demo_key;
        
        // For Anthropic, don't fetch the API key to frontend - backend will use its own key
        if (api.demo_key === null && api.id === 'anthropic') {
            demoKey = null; // Don't expose API key to frontend
        }
        
        onSelectApi({
            documentation: api.sample_doc,
            id: api.id,  // Use id instead of name for provider_hint
            apiName: api.name,
            demoKey: demoKey, // This will be null for Anthropic, which is correct
            docsUrl: api.docs_url
        });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Globe className="w-6 h-6 text-blue-400" />
                        Select Ready Public API
                    </DialogTitle>
                    <p className="text-gray-300 text-sm">
                        Select an API from the list below to get ready documentation and demo key (if available)
                    </p>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {PUBLIC_APIS.map((api) => (
                        <Card key={api.id} className="bg-black/20 border-white/10 hover:border-white/30 transition-colors cursor-pointer">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-white text-lg">{api.name}</CardTitle>
                                    <Badge className={`${CATEGORY_COLORS[api.category]} text-white`}>
                                        {api.category}
                                    </Badge>
                                </div>
                                <p className="text-gray-300 text-sm">{api.description}</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-400">
                                        <FileText className="w-4 h-4" />
                                        <span>Documentation Available</span>
                                    </div>
                                    {(api.demo_key || api.id === 'anthropic') && (
                                        <div className="flex items-center gap-2 text-sm text-green-400">
                                            <Key className="w-4 h-4" />
                                            <span>{api.id === 'anthropic' ? 'API Key Available' : 'Demo Key Included'}</span>
                                        </div>
                                    )}
                                    <Button 
                                        onClick={() => handleSelectApi(api)}
                                        className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                        Select This API
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                    <div className="flex items-start gap-2">
                        <Info className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-yellow-200">
                            <p className="font-semibold mb-1">📌 Important to know:</p>
                            <p>These are public APIs for testing only. For full use, please register on the original website and get a real API key.</p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}