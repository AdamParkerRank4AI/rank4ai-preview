import blogs from '../data/blogs.json';

export async function GET() {
  const sortedBlogs = [...blogs].sort((a: any, b: any) => {
    const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return dateB - dateA;
  });

  const items = sortedBlogs.map((post: any) => {
    const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : '';
    return `    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://www.rank4ai.co.uk/blog/${post.slug}/</link>
      <guid>https://www.rank4ai.co.uk/blog/${post.slug}/</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ''}
      <description><![CDATA[${post.cardExcerpt || post.directAnswer || post.title}]]></description>
      <author>info@rank4ai.co.uk (${post.author || 'Adam Parker'})</author>
    </item>`;
  }).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Rank4AI Blog</title>
    <link>https://www.rank4ai.co.uk/blog/</link>
    <description>Practical insights on AI search visibility from Rank4AI.</description>
    <language>en-GB</language>
    <atom:link href="https://www.rank4ai.co.uk/rss.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' }
  });
}
