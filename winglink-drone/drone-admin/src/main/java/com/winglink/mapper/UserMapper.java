package com.winglink.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.winglink.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
}
