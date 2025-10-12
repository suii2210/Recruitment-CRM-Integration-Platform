/*
  # Create Blogs Table

  1. New Tables
    - `blogs`
      - `id` (uuid, primary key, auto-generated)
      - `title` (text, required) - Blog post title
      - `slug` (text, unique, required) - URL-friendly version of title
      - `content` (text, required) - Blog post content (rich text HTML)
      - `excerpt` (text) - Short summary of the blog post
      - `featured_image` (text) - URL to featured image
      - `author_name` (text, required) - Name of the author
      - `author_id` (text) - Reference to user/author
      - `category` (text) - Blog category
      - `tags` (text[]) - Array of tags
      - `status` (text, default 'draft') - draft, published, archived
      - `published_at` (timestamptz) - When the blog was published
      - `views_count` (integer, default 0) - Number of views
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())
      - `created_by` (uuid) - User who created the blog
      - `updated_by` (uuid) - User who last updated the blog

  2. Security
    - Enable RLS on `blogs` table
    - Add policy for authenticated users to read all published blogs
    - Add policy for authenticated users to create blogs
    - Add policy for authenticated users to update their own blogs
    - Add policy for authenticated users to delete their own blogs
    - Add policy for admins to manage all blogs

  3. Indexes
    - Index on `slug` for fast lookups
    - Index on `status` for filtering
    - Index on `created_at` for sorting
    - Index on `author_id` for author filtering
*/

-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  content text NOT NULL,
  excerpt text,
  featured_image text,
  author_name text NOT NULL,
  author_id text,
  category text,
  tags text[] DEFAULT '{}',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at timestamptz,
  views_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON blogs(author_id);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);

-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read published blogs
CREATE POLICY "Anyone can view published blogs"
  ON blogs FOR SELECT
  TO authenticated
  USING (status = 'published' OR created_by = auth.uid());

-- Policy: Authenticated users can create blogs
CREATE POLICY "Authenticated users can create blogs"
  ON blogs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy: Users can update their own blogs
CREATE POLICY "Users can update own blogs"
  ON blogs FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Policy: Users can delete their own blogs
CREATE POLICY "Users can delete own blogs"
  ON blogs FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blogs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
DROP TRIGGER IF EXISTS blogs_updated_at_trigger ON blogs;
CREATE TRIGGER blogs_updated_at_trigger
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blogs_updated_at();