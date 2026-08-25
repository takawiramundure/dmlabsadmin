import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService } from '@/services/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { siteId, title, context, tone = 'professional, engaging and authoritative', length = 'medium', keywords = [] } = body;

        if (!title && !context) {
            return NextResponse.json({ error: 'Title or context is required for AI generation.' }, { status: 400 });
        }

        // 1. Fetch Tenant's AI Settings & Branding from Firestore
        let aiConfig: any = null;
        let siteName = 'Our Organization';
        if (siteId) {
            try {
                const settings = await FirestoreService.getSiteSettings(siteId);
                aiConfig = settings?.aiSettings;
                if (settings?.branding?.siteName) {
                    siteName = settings.branding.siteName;
                }
            } catch (err) {
                console.warn('Could not fetch tenant AI settings:', err);
            }
        }

        const provider = aiConfig?.provider || 'gemini';
        const apiKey = aiConfig?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY;
        const brandTone = aiConfig?.brandTone || tone;

        const wordCount = length === 'short' ? '400-600 words' : length === 'long' ? '1200-1600 words' : '800-1100 words';

        const prompt = `You are an expert content strategist and copywriter for "${siteName}".
Write an engaging, high-quality, SEO-optimized blog article.

TOPIC/TITLE: ${title || 'Comprehensive Guide & Insights'}
BACKGROUND CONTEXT / KEY POINTS TO COVER:
${context || 'Provide in-depth analysis, practical takeaways, and community impact.'}

REQUIREMENTS:
1. Target length: ${wordCount}.
2. Tone: ${brandTone}.
3. Formatting: Output the content in clean HTML (using <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em>, and <blockquote>). Do NOT include <h1> or markdown code block markers.
4. Add a styled "Key Takeaways" callout box near the top.
5. Provide high-converting SEO metadata.

Return ONLY a valid JSON object matching this exact schema:
{
  "title": "Engaging & Compelling Final Blog Title",
  "excerpt": "A captivating 2-sentence summary suitable for preview cards and social sharing.",
  "content": "<p>Intro paragraph...</p><h2>Subheading</h2><p>Body...</p>",
  "seoTitle": "SEO Meta Title under 60 characters | ${siteName}",
  "seoDescription": "Engaging meta description under 155 characters that encourages clicks.",
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4", "Tag5"]
}`;

        // 2. Multi-Provider Execution Engine
        if (provider === 'gemini' || (!aiConfig?.provider && (process.env.GEMINI_API_KEY || siteId === 'dmlabs'))) {
            const geminiKey = aiConfig?.apiKey || process.env.GEMINI_API_KEY || '';
            if (!geminiKey) {
                return NextResponse.json({
                    error: 'Gemini API Key is missing. Please configure your API key in Site Settings > AI Configuration.',
                    needsConfig: true
                }, { status: 400 });
            }

            const model = aiConfig?.model || 'gemini-1.5-flash';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        temperature: 0.7
                    }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Gemini API error: ${response.statusText} - ${errText}`);
            }

            const data = await response.json();
            const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
            const parsed = JSON.parse(textResponse);
            return NextResponse.json({ success: true, data: parsed });

        } else if (provider === 'openai') {
            const openaiKey = aiConfig?.apiKey || process.env.OPENAI_API_KEY;
            if (!openaiKey) {
                return NextResponse.json({
                    error: 'OpenAI API Key is missing. Please configure your API key in Site Settings > AI Configuration.',
                    needsConfig: true
                }, { status: 400 });
            }

            const model = aiConfig?.model || 'gpt-4o-mini';
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${openaiKey}`
                },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: 'You are an expert blog author. Always respond in valid JSON matching the requested schema.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" },
                    temperature: 0.7
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`OpenAI API error: ${response.statusText} - ${errText}`);
            }

            const data = await response.json();
            const contentStr = data.choices?.[0]?.message?.content;
            const parsed = JSON.parse(contentStr);
            return NextResponse.json({ success: true, data: parsed });

        } else if (provider === 'anthropic') {
            const anthropicKey = aiConfig?.apiKey || process.env.ANTHROPIC_API_KEY;
            if (!anthropicKey) {
                return NextResponse.json({
                    error: 'Anthropic API Key is missing. Please configure your API key in Site Settings > AI Configuration.',
                    needsConfig: true
                }, { status: 400 });
            }

            const model = aiConfig?.model || 'claude-3-5-sonnet-20241022';
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': anthropicKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 4000,
                    system: 'You are an expert blog author. Always respond with only valid JSON matching the requested schema.',
                    messages: [{ role: 'user', content: prompt }]
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`Anthropic API error: ${response.statusText} - ${errText}`);
            }

            const data = await response.json();
            const contentStr = data.content?.[0]?.text;
            const cleaned = contentStr.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsed = JSON.parse(cleaned);
            return NextResponse.json({ success: true, data: parsed });

        } else {
            return NextResponse.json({ error: `Unsupported AI provider: ${provider}` }, { status: 400 });
        }

    } catch (err: any) {
        console.error('AI Blog Generation Error:', err);
        return NextResponse.json({ error: err.message || 'Failed to generate blog post with AI.' }, { status: 500 });
    }
}
