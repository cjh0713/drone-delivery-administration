package com.winglink.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.winglink.entity.DeliveryOrder;

public interface OrderService extends IService<DeliveryOrder> {
    
    void createOrder(DeliveryOrder order);
    
    void cancelOrder(Long orderId);
    
    void restoreOrder(Long orderId);
    
    Double estimatePrice(Double weight, Double distance);
}
