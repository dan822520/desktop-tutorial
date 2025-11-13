-- 资产二维码管理系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS asset_qrcode_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE asset_qrcode_db;

-- 1. 组织/分公司表
CREATE TABLE IF NOT EXISTS org (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '组织名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '组织编码',
    parent_id INT DEFAULT NULL COMMENT '父组织ID',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent_id (parent_id),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='组织/分公司表';

-- 2. 部门表
CREATE TABLE IF NOT EXISTS department (
    id INT AUTO_INCREMENT PRIMARY KEY,
    org_id INT NOT NULL COMMENT '所属组织ID',
    name VARCHAR(100) NOT NULL COMMENT '部门名称',
    code VARCHAR(50) NOT NULL COMMENT '部门编码',
    parent_id INT DEFAULT NULL COMMENT '父部门ID',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_org_code (org_id, code),
    INDEX idx_org_id (org_id),
    INDEX idx_parent_id (parent_id),
    FOREIGN KEY (org_id) REFERENCES org(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='部门表';

-- 3. 角色表
CREATE TABLE IF NOT EXISTS role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT '角色名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '角色编码',
    description VARCHAR(200) COMMENT '角色描述',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='角色表';

-- 4. 用户表
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    real_name VARCHAR(50) NOT NULL COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    org_id INT NOT NULL COMMENT '所属组织ID',
    department_id INT COMMENT '所属部门ID',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_org_id (org_id),
    INDEX idx_department_id (department_id),
    INDEX idx_phone (phone),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (department_id) REFERENCES department(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 5. 用户角色关联表
CREATE TABLE IF NOT EXISTS user_role (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '用户ID',
    role_id INT NOT NULL COMMENT '角色ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_role (user_id, role_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role_id (role_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户角色关联表';

-- 6. 资产分类表
CREATE TABLE IF NOT EXISTS asset_category (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_id INT DEFAULT NULL COMMENT '父分类ID',
    name VARCHAR(100) NOT NULL COMMENT '分类名称',
    code VARCHAR(50) NOT NULL UNIQUE COMMENT '分类编码',
    level INT DEFAULT 1 COMMENT '层级',
    is_active TINYINT(1) DEFAULT 1 COMMENT '是否启用',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_parent_id (parent_id),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产分类表';

-- 7. 资产表
CREATE TABLE IF NOT EXISTS asset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id VARCHAR(100) NOT NULL UNIQUE COMMENT '资产编号',
    name VARCHAR(200) NOT NULL COMMENT '资产名称',
    category_id INT NOT NULL COMMENT '资产分类ID',
    org_id INT NOT NULL COMMENT '所属组织ID',
    department_id INT COMMENT '当前部门ID',
    user_id INT COMMENT '当前负责人ID',
    location VARCHAR(200) COMMENT '具体位置',
    status ENUM('在用', '闲置', '维修中', '调拨中', '报废') DEFAULT '在用' COMMENT '资产状态',

    -- 基本信息
    brand VARCHAR(100) COMMENT '品牌',
    model VARCHAR(100) COMMENT '型号',
    serial_no VARCHAR(100) COMMENT '出厂序列号',
    supplier VARCHAR(200) COMMENT '供应商',

    -- 财务信息
    purchase_date DATE COMMENT '采购日期',
    purchase_price DECIMAL(15,2) COMMENT '采购价格',
    warranty_expire_date DATE COMMENT '质保到期日期',
    expected_life_years INT COMMENT '预计使用年限',

    -- 二维码信息
    qr_code_content TEXT COMMENT '二维码内容',
    qr_code_image_url VARCHAR(500) COMMENT '二维码图片URL',

    -- 备注
    remark TEXT COMMENT '备注',

    -- 系统字段
    created_by INT COMMENT '创建人ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_by INT COMMENT '更新人ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_asset_id (asset_id),
    INDEX idx_category_id (category_id),
    INDEX idx_org_id (org_id),
    INDEX idx_department_id (department_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (category_id) REFERENCES asset_category(id),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (department_id) REFERENCES department(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产主表';

-- 8. 资产照片表
CREATE TABLE IF NOT EXISTS asset_photo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_id INT NOT NULL COMMENT '资产ID',
    url VARCHAR(500) NOT NULL COMMENT '照片URL',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_asset_id (asset_id),
    FOREIGN KEY (asset_id) REFERENCES asset(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产照片表';

-- 9. 资产调拨表
CREATE TABLE IF NOT EXISTS asset_transfer (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transfer_no VARCHAR(100) NOT NULL UNIQUE COMMENT '调拨单号',
    asset_id INT NOT NULL COMMENT '资产ID',

    -- 调出信息
    from_org_id INT NOT NULL COMMENT '调出组织ID',
    from_department_id INT COMMENT '调出部门ID',
    from_user_id INT COMMENT '调出负责人ID',

    -- 调入信息
    to_org_id INT NOT NULL COMMENT '调入组织ID',
    to_department_id INT COMMENT '调入部门ID',
    to_user_id INT COMMENT '调入负责人ID',

    -- 调拨信息
    reason TEXT COMMENT '调拨原因',
    status ENUM('草稿', '审批中', '已通过', '已驳回', '已取消') DEFAULT '草稿' COMMENT '调拨状态',

    -- 流程信息
    apply_user_id INT NOT NULL COMMENT '申请人ID',
    apply_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '申请时间',
    approve_user_id INT COMMENT '审批人ID',
    approve_time TIMESTAMP NULL COMMENT '审批时间',
    reject_reason TEXT COMMENT '驳回原因',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_asset_id (asset_id),
    INDEX idx_transfer_no (transfer_no),
    INDEX idx_status (status),
    INDEX idx_apply_user_id (apply_user_id),
    FOREIGN KEY (asset_id) REFERENCES asset(id),
    FOREIGN KEY (from_org_id) REFERENCES org(id),
    FOREIGN KEY (to_org_id) REFERENCES org(id),
    FOREIGN KEY (apply_user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产调拨表';

-- 10. 资产报修表
CREATE TABLE IF NOT EXISTS asset_repair (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repair_no VARCHAR(100) NOT NULL UNIQUE COMMENT '维修单号',
    asset_id INT NOT NULL COMMENT '资产ID',

    -- 报修信息
    report_user_id INT NOT NULL COMMENT '报修人ID',
    report_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '报修时间',
    level ENUM('轻微', '一般', '严重') DEFAULT '一般' COMMENT '故障等级',
    description TEXT NOT NULL COMMENT '故障描述',
    can_continue_use TINYINT(1) DEFAULT 0 COMMENT '能否继续使用',

    -- 派单信息
    assign_user_id INT COMMENT '派单人ID',
    repair_user_id INT COMMENT '维修人ID',

    -- 维修信息
    repair_start_time TIMESTAMP NULL COMMENT '维修开始时间',
    repair_finish_time TIMESTAMP NULL COMMENT '维修完成时间',
    result TEXT COMMENT '处理结果描述',
    used_parts TEXT COMMENT '使用配件清单',
    cost DECIMAL(10,2) COMMENT '维修费用',

    -- 工单状态
    status ENUM('待派单', '待维修', '维修中', '已完成', '已关闭') DEFAULT '待派单' COMMENT '工单状态',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_asset_id (asset_id),
    INDEX idx_repair_no (repair_no),
    INDEX idx_status (status),
    INDEX idx_report_user_id (report_user_id),
    INDEX idx_repair_user_id (repair_user_id),
    FOREIGN KEY (asset_id) REFERENCES asset(id),
    FOREIGN KEY (report_user_id) REFERENCES user(id),
    FOREIGN KEY (repair_user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='资产报修表';

-- 11. 维修照片表
CREATE TABLE IF NOT EXISTS asset_repair_photo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    repair_id INT NOT NULL COMMENT '维修单ID',
    url VARCHAR(500) NOT NULL COMMENT '照片URL',
    photo_type ENUM('故障照片', '维修照片') DEFAULT '故障照片' COMMENT '照片类型',
    sort_order INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_repair_id (repair_id),
    FOREIGN KEY (repair_id) REFERENCES asset_repair(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='维修照片表';

-- 12. 盘点任务表
CREATE TABLE IF NOT EXISTS inventory_task (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_no VARCHAR(100) NOT NULL UNIQUE COMMENT '盘点任务编号',
    name VARCHAR(200) NOT NULL COMMENT '任务名称',
    org_id INT NOT NULL COMMENT '组织ID',
    creator_id INT NOT NULL COMMENT '创建人ID',
    status ENUM('待执行', '执行中', '已完成', '已取消') DEFAULT '待执行' COMMENT '任务状态',
    scope_type ENUM('全盘', '抽盘') DEFAULT '抽盘' COMMENT '盘点类型',
    start_date DATE COMMENT '计划开始日期',
    end_date DATE COMMENT '计划结束日期',
    finish_date DATE COMMENT '实际完成日期',
    total_count INT DEFAULT 0 COMMENT '总资产数',
    scanned_count INT DEFAULT 0 COMMENT '已盘点数',
    remark TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_task_no (task_no),
    INDEX idx_org_id (org_id),
    INDEX idx_status (status),
    FOREIGN KEY (org_id) REFERENCES org(id),
    FOREIGN KEY (creator_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点任务表';

-- 13. 盘点任务资产表
CREATE TABLE IF NOT EXISTS inventory_task_asset (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL COMMENT '盘点任务ID',
    asset_id INT NOT NULL COMMENT '资产ID',
    is_scanned TINYINT(1) DEFAULT 0 COMMENT '是否已盘点',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_task_asset (task_id, asset_id),
    INDEX idx_task_id (task_id),
    INDEX idx_asset_id (asset_id),
    FOREIGN KEY (task_id) REFERENCES inventory_task(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES asset(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点任务资产表';

-- 14. 盘点记录表
CREATE TABLE IF NOT EXISTS inventory_record (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_id INT NOT NULL COMMENT '盘点任务ID',
    asset_id INT NOT NULL COMMENT '资产ID',
    scan_user_id INT NOT NULL COMMENT '盘点人ID',
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '盘点时间',
    result_status ENUM('正常', '位置不符', '未找到', '状态异常') DEFAULT '正常' COMMENT '盘点结果',
    actual_location VARCHAR(200) COMMENT '实际位置',
    remark TEXT COMMENT '备注',

    INDEX idx_task_id (task_id),
    INDEX idx_asset_id (asset_id),
    INDEX idx_scan_user_id (scan_user_id),
    FOREIGN KEY (task_id) REFERENCES inventory_task(id) ON DELETE CASCADE,
    FOREIGN KEY (asset_id) REFERENCES asset(id),
    FOREIGN KEY (scan_user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='盘点记录表';

-- 15. 操作日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT '操作人ID',
    action VARCHAR(100) NOT NULL COMMENT '操作动作',
    target_type VARCHAR(50) COMMENT '目标类型',
    target_id VARCHAR(100) COMMENT '目标ID',
    detail_json TEXT COMMENT '详细信息JSON',
    ip_address VARCHAR(50) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT 'User Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_target (target_type, target_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入初始角色数据
INSERT INTO role (name, code, description) VALUES
('超级管理员', 'SUPER_ADMIN', '系统超级管理员，拥有所有权限'),
('分公司管理员', 'ORG_ADMIN', '分公司管理员，管理本公司资产和用户'),
('部门资产管理员', 'DEPT_ADMIN', '部门资产管理员，管理本部门资产'),
('维修人员', 'REPAIR_STAFF', '设备维修人员'),
('普通员工', 'EMPLOYEE', '普通员工，可查看和报修');

-- 插入初始分类数据
INSERT INTO asset_category (name, code, level, parent_id) VALUES
('设备', 'EQP', 1, NULL),
('模具', 'MOLD', 1, NULL),
('工装', 'TOOL', 1, NULL),
('量具', 'GAUGE', 1, NULL),
('办公设备', 'OFFICE', 1, NULL),
('其他', 'OTHER', 1, NULL);
