package com.winglink.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("drone")
public class Drone {
    
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String droneNo;
    
    private String model;
    
    private Integer batteryCapacity;
    
    private Double maxLoad;
    
    private String currentStatus;
    
    private String currentLocation;
    
    private Double currentLng;
    
    private Double currentLat;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableLogic
    private Integer deleted;
}
