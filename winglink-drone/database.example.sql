-- 翼联智航 - 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS drone_platform DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE drone_platform;

-- 1. 用户表
CREATE TABLE sys_user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    password VARCHAR(100) NOT NULL COMMENT '密码',
    real_name VARCHAR(50) COMMENT '真实姓名',
    phone VARCHAR(20) COMMENT '手机号',
    email VARCHAR(100) COMMENT '邮箱',
    avatar VARCHAR(255) COMMENT '头像URL',
    role ENUM('USER','ADMIN','OPERATOR') DEFAULT 'USER' COMMENT '角色',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除：0未删除 1已删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 2. 无人机表
CREATE TABLE drone (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    drone_no VARCHAR(50) NOT NULL UNIQUE COMMENT '无人机编号',
    model VARCHAR(50) COMMENT '型号',
    battery_capacity INT COMMENT '电池容量(mAh)',
    max_load DECIMAL(10,2) COMMENT '最大载重(kg)',
    current_status ENUM('IDLE','DELIVERING','CHARGING','MAINTENANCE') DEFAULT 'IDLE' COMMENT '当前状态',
    current_location VARCHAR(255) COMMENT '当前位置描述',
    current_lng DECIMAL(10,7) COMMENT '当前经度',
    current_lat DECIMAL(10,7) COMMENT '当前纬度',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='无人机表';

-- 3. 配送订单表
CREATE TABLE delivery_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(50) NOT NULL UNIQUE COMMENT '订单编号',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    drone_id BIGINT COMMENT '分配的无人机ID',
    district VARCHAR(50) COMMENT '配送区域',
    sender_name VARCHAR(50) COMMENT '寄件人姓名',
    sender_phone VARCHAR(20) COMMENT '寄件人电话',
    sender_address VARCHAR(255) COMMENT '寄件地址',
    sender_lng DECIMAL(10,7) COMMENT '寄件经度',
    sender_lat DECIMAL(10,7) COMMENT '寄件纬度',
    receiver_name VARCHAR(50) COMMENT '收件人姓名',
    receiver_phone VARCHAR(20) COMMENT '收件人电话',
    receiver_address VARCHAR(255) COMMENT '收件地址',
    receiver_lng DECIMAL(10,7) COMMENT '收件经度',
    receiver_lat DECIMAL(10,7) COMMENT '收件纬度',
    cargo_weight DECIMAL(10,2) COMMENT '货物重量(kg)',
    cargo_type VARCHAR(50) COMMENT '货物类型',
    remark VARCHAR(500) COMMENT '备注',
    status ENUM('PENDING','ASSIGNED','DELIVERING','DELIVERED','CANCELLED') DEFAULT 'PENDING' COMMENT '订单状态',
    estimated_time INT COMMENT '预计配送时间(分钟)',
    actual_time INT COMMENT '实际配送时间(分钟)',
    price DECIMAL(10,2) COMMENT '订单价格',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配送订单表';

-- 4. 航线表
CREATE TABLE flight_route (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    route_name VARCHAR(100) COMMENT '航线名称',
    start_point VARCHAR(255) COMMENT '起点',
    end_point VARCHAR(255) COMMENT '终点',
    start_lng DECIMAL(10,7) COMMENT '起点经度',
    start_lat DECIMAL(10,7) COMMENT '起点纬度',
    end_lng DECIMAL(10,7) COMMENT '终点经度',
    end_lat DECIMAL(10,7) COMMENT '终点纬度',
    waypoints JSON COMMENT '途经点JSON',
    distance DECIMAL(10,2) COMMENT '总距离(km)',
    estimated_duration INT COMMENT '预计时长(秒)',
    risk_level ENUM('LOW','MEDIUM','HIGH') COMMENT '风险等级',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='航线表';

-- 5. 禁飞区/限飞区表
CREATE TABLE no_fly_zone (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    zone_name VARCHAR(100) COMMENT '区域名称',
    zone_type ENUM('PROHIBITED','RESTRICTED','WARNING') COMMENT '区域类型',
    center_lng DECIMAL(10,7) COMMENT '中心经度',
    center_lat DECIMAL(10,7) COMMENT '中心纬度',
    radius INT COMMENT '半径(米)',
    altitude_limit INT COMMENT '限高(米)',
    effective_time TIME COMMENT '生效时间',
    expire_time TIME COMMENT '失效时间',
    description VARCHAR(500) COMMENT '描述',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='禁飞区表';

-- 6. 科普文章表
CREATE TABLE article (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL COMMENT '标题',
    cover_image VARCHAR(255) COMMENT '封面图片',
    summary VARCHAR(500) COMMENT '摘要',
    content TEXT COMMENT '内容',
    category ENUM('POLICY','TECH','SAFETY','INDUSTRY') COMMENT '分类',
    author VARCHAR(50) COMMENT '作者',
    view_count INT DEFAULT 0 COMMENT '浏览量',
    is_top TINYINT DEFAULT 0 COMMENT '是否置顶：0否 1是',
    status TINYINT DEFAULT 1 COMMENT '状态：0禁用 1启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='科普文章表';

-- 7. 实时追踪记录表
CREATE TABLE tracking_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_id BIGINT NOT NULL COMMENT '订单ID',
    drone_id BIGINT COMMENT '无人机ID',
    longitude DECIMAL(10,7) NOT NULL COMMENT '经度',
    latitude DECIMAL(10,7) NOT NULL COMMENT '纬度',
    altitude DECIMAL(8,2) COMMENT '高度(m)',
    speed DECIMAL(6,2) COMMENT '速度(m/s)',
    battery_level INT COMMENT '电量百分比',
    status VARCHAR(50) COMMENT '状态',
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='实时追踪记录表';

-- 8. 数据统计表(按天汇总)
CREATE TABLE daily_statistics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    stat_date DATE NOT NULL COMMENT '统计日期',
    total_orders INT DEFAULT 0 COMMENT '总订单数',
    completed_orders INT DEFAULT 0 COMMENT '完成订单数',
    total_distance DECIMAL(10,2) DEFAULT 0 COMMENT '总距离(km)',
    avg_delivery_time INT DEFAULT 0 COMMENT '平均配送时间(分钟)',
    total_revenue DECIMAL(12,2) DEFAULT 0 COMMENT '总收入',
    drone_utilization DECIMAL(5,2) DEFAULT 0 COMMENT '无人机利用率'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计表';

-- 本公开脚本不包含任何用户、手机号、地址或历史订单行。

-- 创建索引
CREATE INDEX idx_order_user_id ON delivery_order(user_id);
CREATE INDEX idx_order_status ON delivery_order(status);
CREATE INDEX idx_order_create_time ON delivery_order(create_time);
CREATE INDEX idx_tracking_order_id ON tracking_record(order_id);
CREATE INDEX idx_tracking_drone_id ON tracking_record(drone_id);
CREATE INDEX idx_article_category ON article(category);
CREATE INDEX idx_stat_date ON daily_statistics(stat_date);
