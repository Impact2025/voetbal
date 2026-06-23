import { supabase } from './supabase';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  cover_image_url: string | null;
  category: string | null;
  meta_title: string | null;
  meta_description: string | null;
  keywords: string[];
  status: 'draft' | 'published';
  seo_score: number;
  author: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export type BlogDraft = Partial<BlogPost> & { slug: string; title: string };

// Superadmin ziet alle posts (RLS staat dat toe naast de publieke read-policy).
export async function fetchPosts(): Promise<BlogPost[]> {
  const { data, error } = await supabase.from('blog_posts').select('*').order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as BlogPost[];
}

export async function createPost(patch: BlogDraft): Promise<BlogPost> {
  const { data, error } = await supabase.from('blog_posts').insert(patch).select().single();
  if (error) throw new Error(error.message);
  return data as BlogPost;
}

export async function updatePost(id: string, patch: Partial<BlogPost>): Promise<void> {
  const { error } = await supabase.from('blog_posts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setPublished(id: string, publish: boolean): Promise<void> {
  const patch: Partial<BlogPost> = {
    status: publish ? 'published' : 'draft',
    published_at: publish ? new Date().toISOString() : null,
  };
  const { error } = await supabase.from('blog_posts').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export interface GeneratedPost {
  title: string; slug: string; excerpt: string;
  meta_title: string; meta_description: string;
  category: string; keywords: string[]; body: string;
}

export async function generatePost(input: { topic: string; keywords?: string; category?: string }): Promise<GeneratedPost> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch('/api/admin/generate-blog', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Generatie mislukt.');
  return json.post as GeneratedPost;
}
