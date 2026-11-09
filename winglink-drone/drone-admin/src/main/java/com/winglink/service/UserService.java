package com.winglink.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.winglink.entity.User;

public interface UserService extends IService<User> {
    
    User getByUsername(String username);
    
    boolean register(User user);
    
    String login(String username, String password, String role);
}
