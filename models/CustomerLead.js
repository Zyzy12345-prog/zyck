// 客户线索模型
module.exports = (sequelize, DataTypes) => {
  const CustomerLead = sequelize.define('CustomerLead', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'company_name',
      comment: '公司名称'
    },
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'contact_person',
      comment: '联系人'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '电话'
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '邮箱'
    },
    wechat: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '微信号'
    },
    source: {
      type: DataTypes.ENUM('website', 'referral', 'cold_call', 'exhibition', 'social_media', 'partner', 'other'),
      allowNull: false,
      defaultValue: 'other',
      comment: '线索来源'
    },
    sourceDetail: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'source_detail',
      comment: '来源详情'
    },
    industryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'industry_id',
      comment: '行业分类ID'
    },
    companyScale: {
      type: DataTypes.ENUM('micro', 'small', 'medium', 'large'),
      allowNull: true,
      field: 'company_scale',
      comment: '公司规模'
    },
    estimatedValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'estimated_value',
      comment: '预估价值'
    },
    priority: {
      type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
      comment: '优先级'
    },
    status: {
      type: DataTypes.ENUM('new', 'contacted', 'qualified', 'negotiating', 'converted', 'lost'),
      allowNull: false,
      defaultValue: 'new',
      comment: '线索状态'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      comment: '分配给（用户ID）'
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'assigned_at',
      comment: '分配时间'
    },
    convertedClientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'converted_client_id',
      comment: '转化后的客户ID'
    },
    convertedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'converted_at',
      comment: '转化时间'
    },
    lostReason: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'lost_reason',
      comment: '丢失原因'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '备注'
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '地址'
    },
    website: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '网址'
    },
    lastContactTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_contact_time',
      comment: '最后联系时间'
    },
    nextFollowTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'next_follow_time',
      comment: '下次跟进时间'
    },
    score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: '线索评分（0-100）'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by',
      comment: '创建人'
    }
  }, {
    tableName: 'customer_leads',
    timestamps: true,
    underscored: true
  });

  CustomerLead.associate = function(models) {
    CustomerLead.belongsTo(models.User, {
      foreignKey: 'assignedTo',
      as: 'assignedUser'
    });
    CustomerLead.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator'
    });
    CustomerLead.belongsTo(models.IndustryCategory, {
      foreignKey: 'industryId',
      as: 'industry'
    });
    CustomerLead.belongsTo(models.Client, {
      foreignKey: 'convertedClientId',
      as: 'convertedClient'
    });
    CustomerLead.belongsToMany(models.LeadTag, {
      through: 'lead_tag_relations',
      foreignKey: 'leadId',
      otherKey: 'tagId',
      as: 'tags'
    });
  };

  return CustomerLead;
};


