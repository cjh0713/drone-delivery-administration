package com.winglink.controller.portal;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.winglink.entity.DeliveryOrder;
import com.winglink.service.OrderService;
import com.winglink.utils.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/order")
public class OrderController {
    
    @Autowired
    private OrderService orderService;
    
    @GetMapping("/list")
    public Result<Page<DeliveryOrder>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {
        
        LambdaQueryWrapper<DeliveryOrder> wrapper = new LambdaQueryWrapper<>();
        if (userId != null) {
            wrapper.eq(DeliveryOrder::getUserId, userId);
        }
        if (district != null && !district.isEmpty()) {
            wrapper.eq(DeliveryOrder::getDistrict, district);
        }
        if (status != null && !status.isEmpty()) {
            wrapper.eq(DeliveryOrder::getStatus, status);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(DeliveryOrder::getOrderNo, keyword)
                    .or().like(DeliveryOrder::getSenderName, keyword)
                    .or().like(DeliveryOrder::getReceiverName, keyword)
                    .or().like(DeliveryOrder::getSenderAddress, keyword)
                    .or().like(DeliveryOrder::getReceiverAddress, keyword));
        }
        wrapper.orderByDesc(DeliveryOrder::getCreateTime);
        
        Page<DeliveryOrder> result = orderService.page(new Page<>(page, size), wrapper);
        return Result.success(result);
    }
    
    @GetMapping("/{id}")
    public Result<DeliveryOrder> getById(@PathVariable Long id) {
        DeliveryOrder order = orderService.getById(id);
        return Result.success(order);
    }
    
    @PostMapping("/create")
    public Result<DeliveryOrder> create(@RequestBody DeliveryOrder order) {
        orderService.createOrder(order);
        return Result.success(order);
    }
    
    @PutMapping("/{id}/cancel")
    public Result<Void> cancel(@PathVariable Long id) {
        orderService.cancelOrder(id);
        return Result.success();
    }
    
    @PutMapping("/{id}/restore")
    public Result<Void> restore(@PathVariable Long id) {
        orderService.restoreOrder(id);
        return Result.success();
    }
    
    @GetMapping("/price")
    public Result<Double> estimatePrice(
            @RequestParam Double weight,
            @RequestParam Double distance) {
        Double price = orderService.estimatePrice(weight, distance);
        return Result.success(price);
    }
}
