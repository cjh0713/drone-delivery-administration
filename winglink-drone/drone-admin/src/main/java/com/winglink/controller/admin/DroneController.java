package com.winglink.controller.admin;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.winglink.entity.Drone;
import com.winglink.mapper.DroneMapper;
import com.winglink.utils.Result;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drone")
public class DroneController {

    @Autowired
    private DroneMapper droneMapper;

    @GetMapping("/list")
    public Result<Page<Drone>> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword) {

        LambdaQueryWrapper<Drone> wrapper = new LambdaQueryWrapper<>();
        if (status != null && !status.isEmpty()) {
            wrapper.eq(Drone::getCurrentStatus, status);
        }
        if (keyword != null && !keyword.isEmpty()) {
            wrapper.and(w -> w.like(Drone::getDroneNo, keyword)
                    .or().like(Drone::getModel, keyword)
                    .or().like(Drone::getCurrentLocation, keyword));
        }
        wrapper.orderByDesc(Drone::getCreateTime);

        Page<Drone> result = droneMapper.selectPage(new Page<>(page, size), wrapper);
        return Result.success(result);
    }

    @GetMapping("/{id}")
    public Result<Drone> getById(@PathVariable Long id) {
        Drone drone = droneMapper.selectById(id);
        return Result.success(drone);
    }

    @GetMapping("/all")
    public Result<List<Drone>> all() {
        List<Drone> list = droneMapper.selectList(new LambdaQueryWrapper<Drone>().orderByDesc(Drone::getCreateTime));
        return Result.success(list);
    }
}
