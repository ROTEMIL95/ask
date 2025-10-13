
import React from 'react';
import { Helmet } from 'react-helmet-async';

const SEO = ({
    title = "TalkAPI - AI-Powered API Documentation to Code",
    description = "Transform API documentation into ready-to-use code instantly. Paste docs, ask questions in plain language, get JavaScript, Python, and cURL code.",
    keywords = "API, documentation, code generator, AI, developer tools, REST API, API testing, code snippets, JavaScript, Python, cURL",
    ogImage = "https://talkapi.ai/og-image.png",
    ogUrl = "https://talkapi.ai/",
    canonicalUrl,
    type = "website"
}) => {
    const siteUrl = "https://talkapi.ai";
    const fullUrl = canonicalUrl ? `${siteUrl}${canonicalUrl}` : ogUrl;

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{title}</title>
            <meta name="title" content={title} />
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />

            {/* Canonical URL */}
            <link rel="canonical" href={fullUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={fullUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={ogImage} />
            <meta property="og:site_name" content="TalkAPI" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={fullUrl} />
            <meta property="twitter:title" content={title} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={ogImage} />

            {/* Additional Meta Tags */}
            <meta name="robots" content="index, follow" />
            <meta name="author" content="TalkAPI" />
        </Helmet>
    );
};

export default SEO;
