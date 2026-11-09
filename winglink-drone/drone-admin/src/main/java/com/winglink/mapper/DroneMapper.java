package com.winglink.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.winglink.entity.Drone;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DroneMapper extends BaseMapper<Drone> {
}
