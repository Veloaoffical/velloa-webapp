import { GoogleGenerativeAI } from "@google/generative-ai"
import { NextResponse } from "next/server"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

export async function POST(request: Request) {
  try {
    const { unitDetails, listingDetails } = await request.json()

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Create a prompt that includes all the relevant information
    const prompt = `You are a professional real estate copywriter specializing in Zillow listings. Create a compelling property description that follows Zillow's style and best practices. The description should be optimized for Zillow's platform and search results. Write the description directly without any introductory text or meta-commentary.

Property Specs:
• ${unitDetails.beds} bedrooms
• ${unitDetails.baths} bathrooms
• ${unitDetails.size} square feet
• Monthly rent: $${unitDetails.market_rent}

Available Amenities:

Included in Rent:
${Object.entries(listingDetails.included_in_rent)
  .filter(([, value]) => value)
  .map(([key]) => `• ${key.replace(/_/g, ' ')}`)
  .join('\n')}

Interior Features & Appliances:
${Object.entries(listingDetails.interior_appliances)
  .filter(([, value]) => value)
  .map(([key]) => `• ${key.replace(/_/g, ' ')}`)
  .join('\n')}

Climate Control:
Heating: ${Object.entries(listingDetails.heating)
  .filter(([, value]) => value)
  .map(([key]) => key.replace(/_/g, ' '))
  .join(', ')}
Cooling: ${Object.entries(listingDetails.cooling)
  .filter(([, value]) => value)
  .map(([key]) => key.replace(/_/g, ' '))
  .join(', ')}

Additional Features:
Laundry: ${Object.entries(listingDetails.laundry)
  .filter(([, value]) => value)
  .map(([key]) => key.replace(/_/g, ' '))
  .join(', ')}
Parking: ${Object.entries(listingDetails.parking)
  .filter(([, value]) => value)
  .map(([key]) => key.replace(/_/g, ' '))
  .join(', ')}

Exterior Amenities:
${Object.entries(listingDetails.exterior)
  .filter(([, value]) => value)
  .map(([key]) => `• ${key.replace(/_/g, ' ')}`)
  .join('\n')}

Instructions for Zillow-Optimized Description:
1. Start with a strong opening that highlights the most appealing features
2. Use Zillow's preferred length of 150-200 words
3. Include keywords that Zillow users commonly search for
4. Format with short, scannable paragraphs (2-3 sentences each)
5. List key amenities in an easy-to-read format
6. Mention utilities included in rent
7. Describe the neighborhood or location benefits
8. End with rental terms and a clear call-to-action
9. Avoid all caps, excessive punctuation, or special characters
10. Use Zillow's professional but approachable tone
11. Include phrases like "available for rent" and "contact for viewing"
12. Highlight pet policies or restrictions if applicable

Important: Generate only the description text. Do not include any introductory phrases like "Here's a description" or "Based on your specifications." Start directly with the property description.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const description = response.text()

    return NextResponse.json({ description })
  } catch (error) {
    console.error('Error generating description:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
} 