-- Create chat_rooms table for managing chat sessions
CREATE TABLE IF NOT EXISTS chat_rooms (
  id SERIAL PRIMARY KEY,
  room_name VARCHAR(255) NOT NULL,
  room_type VARCHAR(50) DEFAULT 'client' CHECK (room_type IN ('client', 'lead', 'group', 'direct')),
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  lead_id INTEGER,
  participants JSONB DEFAULT '[]',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
  last_message_at TIMESTAMP,
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_messages table for storing all messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) DEFAULT 'user' CHECK (sender_type IN ('user', 'client', 'system')),
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video', 'system')),
  content TEXT,
  file_id INTEGER REFERENCES file_uploads(id) ON DELETE SET NULL,
  metadata JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create chat_participants table for tracking who is in each room
CREATE TABLE IF NOT EXISTS chat_participants (
  id SERIAL PRIMARY KEY,
  room_id INTEGER NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  UNIQUE(room_id, user_id)
);

-- Create indexes for better performance (after tables are created)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_client_id ON chat_rooms(client_id);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_lead_id ON chat_rooms(lead_id);
        CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_participants') THEN
        CREATE INDEX IF NOT EXISTS idx_chat_participants_room_id ON chat_participants(room_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
    END IF;
END $$;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_chat_rooms_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_chat_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers only if tables exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms') THEN
        DROP TRIGGER IF EXISTS trigger_update_chat_rooms_updated_at ON chat_rooms;
        CREATE TRIGGER trigger_update_chat_rooms_updated_at
            BEFORE UPDATE ON chat_rooms
            FOR EACH ROW
            EXECUTE FUNCTION update_chat_rooms_updated_at();
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        DROP TRIGGER IF EXISTS trigger_update_chat_messages_updated_at ON chat_messages;
        CREATE TRIGGER trigger_update_chat_messages_updated_at
            BEFORE UPDATE ON chat_messages
            FOR EACH ROW
            EXECUTE FUNCTION update_chat_messages_updated_at();
    END IF;
END $$;

-- Create trigger to update room's last_message_at
CREATE OR REPLACE FUNCTION update_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms 
    SET last_message_at = NEW.created_at 
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        DROP TRIGGER IF EXISTS trigger_update_room_last_message ON chat_messages;
        CREATE TRIGGER trigger_update_room_last_message
            AFTER INSERT ON chat_messages
            FOR EACH ROW
            EXECUTE FUNCTION update_room_last_message();
    END IF;
END $$;

-- Add comments
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_rooms') THEN
        COMMENT ON TABLE chat_rooms IS 'Chat rooms for client/lead conversations';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
        COMMENT ON TABLE chat_messages IS 'All chat messages';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_participants') THEN
        COMMENT ON TABLE chat_participants IS 'Chat room participants';
    END IF;
END $$;

