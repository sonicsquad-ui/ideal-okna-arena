/**
 * ORIENTIRPROF.RU — Сборщик страниц
 */

const {
  getSettings,
  getPages,
  getBlog,
  getCases,
  renderHeader,
  renderFooter,
  renderBreadcrumbs,
  renderSchemaJsonLd
} = require('./renderer');

const { renderHomeContent, homeFaq } = require('./pageTemplates');
const {
  renderAboutPage,
  renderConsultationPage,
  renderTestPage,
  renderServicesHubPage,
  renderTeensPage,
  renderAdultsPage,
  renderCareerPage,
  renderCasesPage,
  renderBlogPage,
  renderArticlePage,
  renderContactsPage,
  renderPrivacyPage
} = require('./subpageTemplates');

function buildFullHtml({ page, contentHtml, currentUrl }) {
  const settings = getSettings();
  const canonicalUrl = `https://orientirprof.ru${page.slug === '/' ? '' : page.slug}`;
  const ogImage = page.ogImage ? (page.ogImage.startsWith('http') ? page.ogImage : `https://orientirprof.ru${page.ogImage}`) : 'https://orientirprof.ru/images/marina-bondareva-hero.jpg';

  const schemaJsonLd = renderSchemaJsonLd(page, settings, page.breadcrumbs);
  const headerHtml = renderHeader(currentUrl, settings);
  const breadcrumbsHtml = page.breadcrumbs ? renderBreadcrumbs(page.breadcrumbs) : '';
  const footerHtml = renderFooter(settings);

  return `<!DOCTYPE html>
<html lang="ru" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <meta name="description" content="${page.description || ''}">
  ${page.keywords ? `<meta name="keywords" content="${page.keywords}">` : ''}
  <link rel="canonical" href="${canonicalUrl}">

  <!-- OpenGraph Metadata -->
  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="${settings.siteName}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description || ''}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${page.title}">
  <meta name="twitter:description" content="${page.description || ''}">
  <meta name="twitter:image" content="${ogImage}">

  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/images/logo-compass.svg">

  <!-- Main Styles -->
  <link rel="stylesheet" href="/css/style.css">

  <!-- Schema.org Microdata -->
  ${schemaJsonLd}
</head>
<body>
  ${headerHtml}
  ${breadcrumbsHtml}
  <main id="mainContent">
    ${contentHtml}
  </main>
  ${footerHtml}
</body>
</html>`;
}

function buildPageBySlug(slug) {
  const pages = getPages();
  const settings = getSettings();
  const blog = getBlog();
  const cases = getCases();

  // Find page by slug or key
  let pageKey = Object.keys(pages).find(k => pages[k].slug === slug);
  if (!pageKey && slug === '/') pageKey = 'home';

  // Handle article pages: /blog/{slug}/
  if (slug.startsWith('/blog/') && slug !== '/blog/') {
    const articleSlug = slug.replace(/^\/blog\//, '').replace(/\/$/, '');
    const article = blog.find(b => b.slug === articleSlug);
    if (article) {
      const pageMeta = {
        slug: slug,
        title: `${article.title} | Блог Марины Бондаревой`,
        description: article.excerpt,
        keywords: "профориентация блог, " + article.category.toLowerCase(),
        ogImage: article.image,
        breadcrumbs: [
          { title: "Главная", url: "/" },
          { title: "Блог", url: "/blog/" },
          { title: article.title, url: slug }
        ]
      };
      const related = blog.filter(b => b.slug !== articleSlug);
      const content = renderArticlePage(article, settings, related);
      return buildFullHtml({ page: pageMeta, contentHtml: content, currentUrl: slug });
    }
  }

  if (!pageKey || !pages[pageKey]) {
    // Custom user-created page or 404
    return null;
  }

  const page = pages[pageKey];
  let content = '';

  switch (pageKey) {
    case 'home':
      page.faqList = homeFaq;
      content = renderHomeContent(page, settings);
      break;
    case 'about':
      content = renderAboutPage(page, settings);
      break;
    case 'konsultaciya':
      content = renderConsultationPage(page, settings);
      break;
    case 'test':
      content = renderTestPage(page, settings);
      break;
    case 'services':
      content = renderServicesHubPage(page, settings);
      break;
    case 'service-teens':
      content = renderTeensPage(page, settings);
      break;
    case 'service-adults':
      content = renderAdultsPage(page, settings);
      break;
    case 'service-career':
      content = renderCareerPage(page, settings);
      break;
    case 'cases':
      content = renderCasesPage(page, settings, cases);
      break;
    case 'blog':
      content = renderBlogPage(page, settings, blog);
      break;
    case 'contacts':
      content = renderContactsPage(page, settings);
      break;
    case 'privacy':
      content = renderPrivacyPage(page, settings);
      break;
    default:
      // Custom page created through admin panel!
      content = `
        <div class="container section">
          <div class="section-header">
            <h1 class="section-title">${page.h1 || page.title}</h1>
            ${page.subtitle ? `<p class="section-desc">${page.subtitle}</p>` : ''}
          </div>
          <div class="article-content" style="max-width:860px;margin:0 auto;">
            ${page.content || '<p>Контент страницы редактируется в панели управления.</p>'}
          </div>
        </div>
      `;
      break;
  }

  return buildFullHtml({ page, contentHtml: content, currentUrl: page.slug });
}

module.exports = {
  buildFullHtml,
  buildPageBySlug
};
