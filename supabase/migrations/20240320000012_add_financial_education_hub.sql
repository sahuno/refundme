-- Create enum types for content categories
CREATE TYPE content_category AS ENUM ('tips', 'tax', 'budgeting', 'savings', 'investing');
CREATE TYPE department_type AS ENUM ('stem', 'humanities', 'social_sciences', 'arts', 'general');
CREATE TYPE interaction_type AS ENUM ('viewed', 'bookmarked', 'shared');

-- Create educational_content table
CREATE TABLE educational_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  category content_category NOT NULL,
  tags TEXT[] DEFAULT '{}',
  author_id UUID REFERENCES profiles(id),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create content_interactions table
CREATE TABLE content_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES educational_content(id) ON DELETE CASCADE NOT NULL,
  interaction_type interaction_type NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure unique interaction per user/content/type
  UNIQUE(user_id, content_id, interaction_type)
);

-- Create weekly_tips table
CREATE TABLE weekly_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  tip_content TEXT NOT NULL,
  category TEXT NOT NULL,
  based_on_pattern TEXT, -- What spending pattern triggered this tip
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  opened_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create budget_templates table
CREATE TABLE budget_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  department_type department_type NOT NULL,
  monthly_breakdown JSONB NOT NULL DEFAULT '{}',
  tips TEXT[] DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_educational_content_category ON educational_content(category);
CREATE INDEX idx_educational_content_published_at ON educational_content(published_at DESC);
CREATE INDEX idx_educational_content_slug ON educational_content(slug);
CREATE INDEX idx_content_interactions_user_id ON content_interactions(user_id);
CREATE INDEX idx_content_interactions_content_id ON content_interactions(content_id);
CREATE INDEX idx_weekly_tips_user_id ON weekly_tips(user_id);
CREATE INDEX idx_budget_templates_department ON budget_templates(department_type);

-- Enable RLS on all tables
ALTER TABLE educational_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for educational_content
-- Everyone can view published content
CREATE POLICY "Anyone can view published content" ON educational_content
  FOR SELECT USING (published_at IS NOT NULL AND published_at <= NOW());

-- Admins can manage all content
CREATE POLICY "Admins can manage content" ON educational_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('administrator', 'accountant')
    )
  );

-- RLS Policies for content_interactions
-- Users can view their own interactions
CREATE POLICY "Users can view own interactions" ON content_interactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own interactions
CREATE POLICY "Users can create own interactions" ON content_interactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own interactions
CREATE POLICY "Users can update own interactions" ON content_interactions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own interactions
CREATE POLICY "Users can delete own interactions" ON content_interactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for weekly_tips
-- Users can view their own tips
CREATE POLICY "Users can view own tips" ON weekly_tips
  FOR SELECT USING (auth.uid() = user_id);

-- System can create tips (via service role)
CREATE POLICY "Service role can manage tips" ON weekly_tips
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for budget_templates
-- Everyone can view public templates
CREATE POLICY "Anyone can view public templates" ON budget_templates
  FOR SELECT USING (is_public = true);

-- Users can view their own templates
CREATE POLICY "Users can view own templates" ON budget_templates
  FOR SELECT USING (auth.uid() = created_by);

-- Users can create templates
CREATE POLICY "Users can create templates" ON budget_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Users can update their own templates
CREATE POLICY "Users can update own templates" ON budget_templates
  FOR UPDATE USING (auth.uid() = created_by);

-- Users can delete their own templates
CREATE POLICY "Users can delete own templates" ON budget_templates
  FOR DELETE USING (auth.uid() = created_by);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_view_count(content_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE educational_content 
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = content_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          title,
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single hyphen
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug if not provided
CREATE OR REPLACE FUNCTION auto_generate_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = generate_slug(NEW.title);
    -- Ensure uniqueness by appending timestamp if needed
    WHILE EXISTS (SELECT 1 FROM educational_content WHERE slug = NEW.slug AND id != COALESCE(NEW.id, gen_random_uuid())) LOOP
      NEW.slug = NEW.slug || '-' || EXTRACT(EPOCH FROM NOW())::INTEGER;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_unique_slug
  BEFORE INSERT OR UPDATE ON educational_content
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_slug();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_educational_content_updated_at
  BEFORE UPDATE ON educational_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_templates_updated_at
  BEFORE UPDATE ON budget_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some starter content
INSERT INTO educational_content (title, slug, content, category, tags, featured, published_at) VALUES
(
  'Getting Started with Grad School Finances',
  'getting-started-grad-school-finances',
  E'# Getting Started with Grad School Finances\n\nWelcome to your financial journey as a graduate student! This guide will help you navigate the unique financial challenges and opportunities that come with pursuing an advanced degree.\n\n## Understanding Your Income\n\nAs a grad student, your income might come from various sources:\n- **Stipends**: Regular payments from your department\n- **Teaching Assistantships**: Compensation for teaching duties\n- **Research Assistantships**: Funding for research work\n- **Fellowships**: Merit-based financial support\n\n## Key Financial Tips\n\n1. **Track Everything**: Use RefundMe to monitor all your expenses\n2. **Know Your Benefits**: Understand what your university covers\n3. **Budget by Semester**: Academic calendars affect your spending\n4. **Save for Conferences**: Plan ahead for professional development\n5. **Understand Tax Implications**: Some income may be taxable\n\n## Making the Most of RefundMe\n\nRefundMe is designed specifically for grad students like you. Here''s how to maximize its benefits:\n- Connect your bank accounts for automatic expense tracking\n- Categorize expenses properly for easier reimbursements\n- Submit requests promptly to maintain cash flow\n- Use the analytics to understand your spending patterns\n\n## Next Steps\n\nExplore our other guides on specific topics like budgeting, taxes, and saving strategies. Remember, financial wellness is a journey, not a destination!',
  'tips',
  ARRAY['beginner', 'overview', 'getting-started'],
  true,
  NOW()
),
(
  'Tax Guide for Graduate Students',
  'tax-guide-graduate-students',
  E'# Tax Guide for Graduate Students\n\nNavigating taxes as a graduate student can be complex. This guide breaks down what you need to know.\n\n## Fellowship vs. Assistantship Income\n\n### Fellowships\n- Often not subject to income tax withholding\n- May need to pay quarterly estimated taxes\n- Not subject to FICA taxes\n\n### Assistantships (TA/RA)\n- Subject to income tax withholding\n- Treated as wages\n- Subject to FICA taxes (unless enrolled in sufficient credits)\n\n## Deductible Expenses\n\nCommon deductions for grad students:\n1. **Lifetime Learning Credit**: Up to $2,000 per year\n2. **Student Loan Interest**: Up to $2,500\n3. **Research Expenses**: If required and not reimbursed\n4. **Moving Expenses**: For first job after graduation\n\n## Quarterly Tax Payments\n\nIf you receive fellowship income:\n- Payment due dates: April 15, June 15, Sept 15, Jan 15\n- Use Form 1040-ES to calculate\n- Set aside 15-25% of fellowship income\n\n## Record Keeping Tips\n\n- Save all tuition statements (1098-T)\n- Track research-related expenses\n- Document conference and travel costs\n- Keep records for 7 years\n\n## International Students\n\nSpecial considerations:\n- Tax treaty benefits may apply\n- Different forms required (1040NR)\n- State tax obligations vary\n\nRemember: This is general guidance. Consult a tax professional for personalized advice.',
  'tax',
  ARRAY['taxes', 'fellowship', 'deductions'],
  true,
  NOW()
),
(
  'Building Your First Graduate Student Budget',
  'building-first-graduate-student-budget',
  E'# Building Your First Graduate Student Budget\n\nCreating a realistic budget is crucial for financial success in grad school. Here''s a step-by-step guide.\n\n## Step 1: Calculate Your Income\n\nList all sources:\n- Monthly stipend: $______\n- Teaching/Research assistantship: $______\n- Fellowships/Grants: $______\n- Other income: $______\n- **Total Monthly Income: $______**\n\n## Step 2: Fixed Expenses\n\nThese don''t change month-to-month:\n- Rent: $______\n- Insurance (health, renters): $______\n- Phone/Internet: $______\n- Loan payments: $______\n- **Total Fixed Expenses: $______**\n\n## Step 3: Variable Expenses\n\nThese fluctuate monthly:\n- Groceries: $200-300\n- Transportation: $50-150\n- Utilities: $50-100\n- Personal care: $30-50\n- Entertainment: $50-100\n- **Total Variable Expenses: $______**\n\n## Step 4: Academic Expenses\n\nOften overlooked but important:\n- Books/Supplies: $100-200/semester\n- Conference fees: $500-1000/year\n- Professional memberships: $50-200/year\n- Software/Tools: $20-50/month\n\n## Sample Budget Breakdown\n\nFor a $2,500/month stipend:\n- Housing (30%): $750\n- Food (15%): $375\n- Transportation (5%): $125\n- Utilities (5%): $125\n- Academic (10%): $250\n- Personal (10%): $250\n- Savings (10%): $250\n- Emergency/Buffer (15%): $375\n\n## Tips for Success\n\n1. **Pay Yourself First**: Save before spending\n2. **Use the 50/30/20 Rule**: Adjust for student life\n3. **Plan for Irregular Expenses**: Conferences, moving\n4. **Review Monthly**: Adjust as needed\n5. **Use RefundMe**: Track actual vs. budgeted amounts\n\n## Emergency Fund\n\nAim for $1,000 initially, then build to 3 months of expenses. This helps with:\n- Conference travel advances\n- Unexpected moves\n- Medical expenses\n- Technology repairs\n\nRemember: Your budget is a living document. Adjust it as your circumstances change!',
  'budgeting',
  ARRAY['budget', 'planning', 'money-management'],
  true,
  NOW()
);

-- Insert sample budget templates
INSERT INTO budget_templates (name, department_type, monthly_breakdown, tips) VALUES
(
  'STEM Graduate Student Budget',
  'stem',
  '{
    "income": {
      "stipend": 2500,
      "teaching": 500
    },
    "expenses": {
      "housing": 900,
      "food": 400,
      "transportation": 150,
      "utilities": 100,
      "lab_supplies": 100,
      "software": 50,
      "personal": 200,
      "savings": 300,
      "emergency": 300
    }
  }'::jsonb,
  ARRAY[
    'Budget for conference travel (2-3 per year)',
    'Some lab supplies may be reimbursable',
    'Check if software licenses are provided by department'
  ]
),
(
  'Humanities Graduate Student Budget',
  'humanities',
  '{
    "income": {
      "stipend": 2200,
      "teaching": 600
    },
    "expenses": {
      "housing": 850,
      "food": 350,
      "transportation": 100,
      "utilities": 100,
      "books": 150,
      "research_travel": 100,
      "personal": 200,
      "savings": 250,
      "emergency": 200
    }
  }'::jsonb,
  ARRAY[
    'Library resources can reduce book costs',
    'Archive visits may be grant-fundable',
    'Consider digital subscriptions for research'
  ]
),
(
  'Arts Graduate Student Budget',
  'arts',
  '{
    "income": {
      "stipend": 2000,
      "teaching": 400,
      "commissions": 200
    },
    "expenses": {
      "housing": 800,
      "food": 350,
      "transportation": 120,
      "utilities": 100,
      "materials": 200,
      "studio_space": 150,
      "exhibitions": 80,
      "personal": 150,
      "savings": 200,
      "emergency": 150
    }
  }'::jsonb,
  ARRAY[
    'Material costs vary by medium',
    'Group studio spaces can reduce costs',
    'Exhibition fees may be reimbursable'
  ]
);