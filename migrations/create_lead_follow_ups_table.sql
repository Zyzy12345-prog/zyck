-- 创建线索跟进记录表
CREATE TABLE IF NOT EXISTS lead_follow_ups (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER NOT NULL REFERENCES customer_leads(id) ON DELETE CASCADE,
  follow_up_type VARCHAR(20) NOT NULL DEFAULT 'phone' CHECK (follow_up_type IN ('phone', 'email', 'visit', 'wechat', 'other')),
  follow_up_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  content TEXT NOT NULL,
  result VARCHAR(20) CHECK (result IN ('positive', 'neutral', 'negative', 'no_response')),
  next_follow_up_date TIMESTAMP,
  next_follow_up_plan TEXT,
  duration INTEGER,
  attachments JSONB,
  tags TEXT[],
  is_important BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_lead_follow_ups_lead_id ON lead_follow_ups(lead_id);
CREATE INDEX idx_lead_follow_ups_follow_up_date ON lead_follow_ups(follow_up_date);
CREATE INDEX idx_lead_follow_ups_next_follow_up_date ON lead_follow_ups(next_follow_up_date);
CREATE INDEX idx_lead_follow_ups_created_by ON lead_follow_ups(created_by);
CREATE INDEX idx_lead_follow_ups_result ON lead_follow_ups(result);
CREATE INDEX idx_lead_follow_ups_follow_up_type ON lead_follow_ups(follow_up_type);

-- 添加注释
COMMENT ON TABLE lead_follow_ups IS '线索跟进记录表';
COMMENT ON COLUMN lead_follow_ups.id IS '主键ID';
COMMENT ON COLUMN lead_follow_ups.lead_id IS '线索ID';
COMMENT ON COLUMN lead_follow_ups.follow_up_type IS '跟进方式：phone-电话, email-邮件, visit-拜访, wechat-微信, other-其他';
COMMENT ON COLUMN lead_follow_ups.follow_up_date IS '跟进时间';
COMMENT ON COLUMN lead_follow_ups.content IS '跟进内容';
COMMENT ON COLUMN lead_follow_ups.result IS '跟进结果：positive-积极, neutral-中性, negative-消极, no_response-未响应';
COMMENT ON COLUMN lead_follow_ups.next_follow_up_date IS '下次跟进时间';
COMMENT ON COLUMN lead_follow_ups.next_follow_up_plan IS '下次跟进计划';
COMMENT ON COLUMN lead_follow_ups.duration IS '跟进时长（分钟）';
COMMENT ON COLUMN lead_follow_ups.attachments IS '附件列表（JSON格式）';
COMMENT ON COLUMN lead_follow_ups.tags IS '标签数组';
COMMENT ON COLUMN lead_follow_ups.is_important IS '是否重要';
COMMENT ON COLUMN lead_follow_ups.created_by IS '创建人ID';
COMMENT ON COLUMN lead_follow_ups.created_at IS '创建时间';
COMMENT ON COLUMN lead_follow_ups.updated_at IS '更新时间';

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_lead_follow_ups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_follow_ups_updated_at
  BEFORE UPDATE ON lead_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_follow_ups_updated_at();

-- 插入示例数据（可选）
-- INSERT INTO lead_follow_ups (lead_id, follow_up_type, content, result, created_by)
-- VALUES 
--   (1, 'phone', '首次电话沟通，客户表示有兴趣，约定下周详谈', 'positive', 1),
--   (1, 'email', '发送产品资料和报价单', 'neutral', 1),
--   (2, 'visit', '上门拜访，详细介绍产品功能', 'positive', 1);

COMMIT;










