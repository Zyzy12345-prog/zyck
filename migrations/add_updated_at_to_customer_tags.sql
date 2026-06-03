-- Add missing updated_at column to customer_tags table
ALTER TABLE customer_tags ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add missing updated_at column to client_tag_relations table
ALTER TABLE client_tag_relations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create trigger to auto-update updated_at on customer_tags
CREATE OR REPLACE FUNCTION update_customer_tags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_customer_tags_updated_at ON customer_tags;
CREATE TRIGGER trigger_update_customer_tags_updated_at
    BEFORE UPDATE ON customer_tags
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_tags_updated_at();

-- Create trigger to auto-update updated_at on client_tag_relations
CREATE OR REPLACE FUNCTION update_client_tag_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_client_tag_relations_updated_at ON client_tag_relations;
CREATE TRIGGER trigger_update_client_tag_relations_updated_at
    BEFORE UPDATE ON client_tag_relations
    FOR EACH ROW
    EXECUTE FUNCTION update_client_tag_relations_updated_at();








