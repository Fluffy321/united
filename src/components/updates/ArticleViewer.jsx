import React, { useState, useEffect } from 'react';
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react';
import { dataService } from '@/services';
import { formatDistanceToNow } from 'date-fns';

export default function ArticleViewer({ item, onClose }) {
  const [articleData, setArticleData] = useState(null);
  const [loading, setLoading] = useState(true);

  const image = item.image || articleData?.image;

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await dataService.functions.invoke('fetchArticle', { url: item.link });
        setArticleData(data);
      } catch (_) {}
      setLoading(false);
    };
    fetch();
  }, [item.link]);

  return (
    <div className="fixed inset-0 bg-[#F7F8FA] z-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-[#EAECF0] flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F4F7] transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#344054]" />
          </button>
          <p className="text-[13px] font-semibold text-[#344054] truncate flex-1 text-center">{item.source}</p>
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F2F4F7] transition-colors flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4 text-[#667085]" />
          </a>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto pb-24">
          {/* Hero image */}
          {image && (
            <img
              src={image}
              alt=""
              className="w-full max-h-64 object-cover"
              onError={e => { e.target.style.display = 'none'; }}
            />
          )}

          <div className="px-4 pt-4">
            {/* Title */}
            <h1 className="font-bold text-[20px] text-[#0F1C2E] leading-snug mb-2">{item.title}</h1>

            {/* Meta */}
            <p className="text-[12px] text-[#98A2B3] mb-4">
              <span className="font-medium text-[#667085]">{item.source}</span>
              {' · '}
              {formatDistanceToNow(new Date(item.pubDate), { addSuffix: true })}
            </p>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-[#2563EB]" />
              </div>
            ) : articleData?.articleHtml ? (
              <div
                className="prose prose-sm max-w-none text-[#344054] leading-relaxed article-body"
                dangerouslySetInnerHTML={{ __html: articleData.articleHtml }}
              />
            ) : (
              <div className="space-y-3">
                {(articleData?.ogDesc || item.excerpt) && (
                  <p className="text-[15px] text-[#344054] leading-relaxed font-medium">
                    {articleData?.ogDesc || item.excerpt}
                  </p>
                )}
                {articleData?.plainText && (
                  <p className="text-[14px] text-[#667085] leading-relaxed">
                    {articleData.plainText}
                  </p>
                )}
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#2563EB] mt-2"
                >
                  Read full article <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .article-body img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
        .article-body p { margin-bottom: 12px; font-size: 15px; line-height: 1.65; color: #344054; }
        .article-body h2, .article-body h3 { font-weight: 700; margin: 16px 0 8px; color: #0F1C2E; }
        .article-body a { color: #2563EB; text-decoration: underline; }
        .article-body ul, .article-body ol { padding-left: 20px; margin-bottom: 12px; }
        .article-body li { margin-bottom: 4px; font-size: 15px; color: #344054; }
        .article-body blockquote { border-left: 3px solid #E0EDFF; padding-left: 12px; color: #667085; font-style: italic; margin: 12px 0; }
      `}</style>
    </div>
  );
}