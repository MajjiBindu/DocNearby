import { Helmet } from 'react-helmet-async';

const SEO = ({ 
  title, 
  description, 
  keywords, 
  schemaType = 'MedicalWebPage',
  canonicalUrl = window.location.href,
  ogImage = '/og-image.png',
  schemaData = null
}) => {
  const fullTitle = `${title} | DocNearby - Your Healthcare Companion`;
  
  const defaultSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": fullTitle,
    "description": description,
    "url": canonicalUrl,
    "provider": {
      "@type": "Organization",
      "name": "DocNearby",
      "logo": {
        "@type": "ImageObject",
        "url": "https://docnearby.com/logo.png"
      }
    }
  };

  return (
    <Helmet>
      {/* Basic Metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data (Schema.org) */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData || defaultSchema)}
      </script>
      
      {/* Accessibility: Language */}
      <html lang="en" />
    </Helmet>
  );
};

export default SEO;
