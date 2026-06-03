module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define('Client', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'company_name',
      validate: {
        notEmpty: true
      }
    },
    contactPerson: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'contact_person'
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[0-9-+()\s]*$/i
      }
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    originalIndustry: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'original_industry',
      comment: '原始行业文本'
    },
    industryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'industry_id',
      comment: '行业分类ID'
    },
    registeredCapital: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      field: 'registered_capital',
      defaultValue: 0
    },
    taxStatus: {
      type: DataTypes.ENUM('pending', 'processing', 'completed', 'cancelled'),
      allowNull: false,
      field: 'tax_status',
      defaultValue: 'pending'
    },
    remarks: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '公司地址'
    },
    website: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '公司网址'
    },
    companyScale: {
      type: DataTypes.ENUM('micro', 'small', 'medium', 'large'),
      allowNull: true,
      defaultValue: 'small',
      field: 'company_scale',
      comment: '公司规模'
    },
    employeeCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'employee_count',
      comment: '员工人数'
    },
    establishedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'established_date',
      comment: '成立日期'
    },
    legalRepresentative: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'legal_representative',
      comment: '法定代表人'
    },
    businessScope: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'business_scope',
      comment: '经营范围'
    },
    customerLevel: {
      type: DataTypes.ENUM('A', 'B', 'C', 'D'),
      allowNull: true,
      defaultValue: 'C',
      field: 'customer_level',
      comment: '客户等级'
    },
    customerSource: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'customer_source',
      comment: '客户来源'
    },
    wechat: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '微信号'
    },
    qq: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'QQ号'
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'clients',
    timestamps: true
  });

  Client.associate = function(models) {
    Client.hasMany(models.CallRecord, {
      foreignKey: 'clientId',
      as: 'callRecords'
    });
    Client.hasMany(models.Assignment, {
      foreignKey: 'clientId',
      as: 'assignments'
    });
    Client.belongsTo(models.IndustryCategory, {
      foreignKey: 'industryId',
      as: 'industry'
    });
    Client.hasMany(models.FollowUp, {
      foreignKey: 'clientId',
      as: 'followUps'
    });
    Client.hasMany(models.CustomerFile, {
      foreignKey: 'clientId',
      as: 'files'
    });
    Client.hasMany(models.CustomerDiscussion, {
      foreignKey: 'clientId',
      as: 'discussions'
    });
    // Phase 2: Sales funnel and customer grading
    Client.hasMany(models.SalesOpportunity, {
      foreignKey: 'clientId',
      as: 'opportunities'
    });
    Client.belongsToMany(models.CustomerTag, {
      through: models.ClientTagRelation,
      foreignKey: 'clientId',
      otherKey: 'tagId',
      as: 'tags'
    });
    Client.hasOne(models.ClientScore, {
      foreignKey: 'clientId',
      as: 'score'
    });
    Client.hasOne(models.ClientValueAnalysis, {
      foreignKey: 'clientId',
      as: 'valueAnalysis'
    });
  };

  return Client;
};
