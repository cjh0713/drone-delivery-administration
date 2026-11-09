package com.winglink.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("delivery_order")
public class DeliveryOrder {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String orderNo;
    
    private Long userId;
    
    private Long droneId;
    
    private String district;
    
    private String senderName;
    
    private String senderPhone;
    
    private String senderAddress;
    
    private Double senderLng;
    
    private Double senderLat;
    
    private String receiverName;
    
    private String receiverPhone;
    
    private String receiverAddress;
    
    private Double receiverLng;
    
    private Double receiverLat;
    
    private Double cargoWeight;
    
    private String cargoType;
    
    private String remark;
    
    private String status;
    
    private Integer estimatedTime;
    
    private Integer actualTime;
    
    private BigDecimal price;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    
    @TableLogic
    private Integer deleted;
}
