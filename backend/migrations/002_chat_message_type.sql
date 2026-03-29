ALTER TABLE chat_messages ADD COLUMN message_type ENUM('text', 'image') NOT NULL DEFAULT 'text' AFTER message;
