package com.winglink.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.winglink.entity.DeliveryOrder;
import com.winglink.mapper.OrderMapper;
import com.winglink.service.OrderService;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class OrderServiceImpl extends ServiceImpl<OrderMapper, DeliveryOrder> implements OrderService {
    
    @Override
    public void createOrder(DeliveryOrder order) {
        // 生成订单号
        String orderNo = "DR" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) 
                + String.format("%03d", (int)(Math.random() * 1000));
        order.setOrderNo(orderNo);
        order.setStatus("PENDING");
        
        save(order);
    }
    
    @Override
    public void cancelOrder(Long orderId) {
        DeliveryOrder order = getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        if (!"PENDING".equals(order.getStatus()) && !"ASSIGNED".equals(order.getStatus())) {
            throw new RuntimeException("订单状态不允许取消");
        }
        
        order.setStatus("CANCELLED");
        order.setDroneId(null);
        updateById(order);
    }
    
    @Override
    public void restoreOrder(Long orderId) {
        DeliveryOrder order = getById(orderId);
        if (order == null) {
            throw new RuntimeException("订单不存在");
        }
        
        if (!"CANCELLED".equals(order.getStatus())) {
            throw new RuntimeException("只有已取消的订单才能恢复");
        }
        
        order.setStatus("PENDING");
        updateById(order);
    }
    
    @Override
    public Double estimatePrice(Double weight, Double distance) {
        // 基础价格15元
        double basePrice = 15.0;
        // 重量附加费
        double weightPrice = Math.max(0, (weight - 1) * 5);
        // 距离附加费
        double distancePrice = distance * 2;
        
        return basePrice + weightPrice + distancePrice;
    }
}
