package com.winglink.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.winglink.entity.DeliveryOrder;
import com.winglink.vo.AreaStatisticsVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface OrderMapper extends BaseMapper<DeliveryOrder> {
    
    List<AreaStatisticsVO> selectAreaStatistics();
    
    Map<String, Object> selectOverviewStatistics();
    
    List<Map<String, Object>> selectCargoStatistics();
    
    List<Map<String, Object>> selectTrendStatistics(@Param("startDate") String startDate, @Param("endDate") String endDate);
}
