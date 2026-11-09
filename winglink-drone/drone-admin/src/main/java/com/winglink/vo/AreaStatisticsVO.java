package com.winglink.vo;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AreaStatisticsVO {
    
    private String district;
    
    private Integer orders;
    
    private Integer completed;
    
    private Integer cancelled;
    
    private BigDecimal revenue;
    
    private BigDecimal avgTime;
    
    private BigDecimal completionRate;
    
    private BigDecimal efficiency;
}
