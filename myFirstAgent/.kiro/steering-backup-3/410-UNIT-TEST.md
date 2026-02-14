---
inclusion: manual
---

# 单元测试编写规范

---

## 测试范围

领域层 - 聚合、实体、值对象、领域服务
应用层 - 应用服务

---

## 测试命名规范

### 测试类命名

```
{被测类名}Test

示例：
- QuantityTest
- InboundOrderTest
- InventoryDomainServiceTest
```

### 测试方法命名

```
{方法名}_{场景}_{预期结果}

示例：
- add_positiveNumbers_returnsSum
- confirm_draftOrder_statusChangesToConfirmed
- confirm_emptyOrder_throwsException
```

---

## 值对象测试

测试要点：
1. 构造函数校验 - 测试不变量约束
2. 相等性 - 测试 equals 和 hashCode
3. 不可变性 - 测试操作返回新对象
4. 业务方法 - 测试所有公开方法

```java
class QuantityTest {
    
    @Test
    void constructor_negativeValue_throwsException() {
        assertThrows(IllegalArgumentException.class, 
            () -> new Quantity(BigDecimal.valueOf(-1)));
    }
    
    @Test
    void add_twoQuantities_returnsNewQuantity() {
        Quantity q1 = Quantity.of(BigDecimal.TEN);
        Quantity q2 = Quantity.of(BigDecimal.valueOf(5));
        
        Quantity result = q1.add(q2);
        
        assertEquals(BigDecimal.valueOf(15), result.value());
        assertEquals(BigDecimal.TEN, q1.value()); // immutability
    }
}
```

---

## 聚合测试

测试要点：
1. 创建 - 测试工厂方法和初始状态
2. 状态变更 - 测试业务方法和状态转换
3. 业务规则 - 测试所有业务规则约束
4. 领域事件 - 测试事件发布

```java
class InboundOrderTest {
    
    @Test
    void confirm_draftOrderWithLines_statusChangesToPending() {
        InboundOrder order = createOrderWithOneLine();
        
        order.confirm();
        
        assertEquals(InboundStatus.PENDING, order.getStatus());
    }
    
    @Test
    void confirm_emptyOrder_throwsException() {
        InboundOrder order = createEmptyOrder();
        
        assertThrows(BusinessException.class, () -> order.confirm());
    }
}
```

---

## 领域服务测试

测试要点：
1. 正常流程 - 测试主要业务逻辑
2. 边界条件 - 测试边界值
3. 异常情况 - 测试异常处理
4. Mock 依赖 - 使用 Mock 隔离外部依赖

```java
@ExtendWith(MockitoExtension.class)
class InventoryDomainServiceTest {
    
    @Mock
    private InventoryRepository inventoryRepository;
    
    @InjectMocks
    private InventoryDomainService service;
    
    @Test
    void transfer_sufficientInventory_transfersSuccessfully() {
        Inventory from = createInventory(100);
        Inventory to = createInventory(50);
        Quantity quantity = Quantity.of(BigDecimal.valueOf(30));
        
        service.transfer(from, to, quantity);
        
        assertEquals(BigDecimal.valueOf(70), from.getQuantity().value());
        assertEquals(BigDecimal.valueOf(80), to.getQuantity().value());
    }
}
```

---

## 应用服务测试

测试要点：
1. 编排逻辑 - 测试服务调用顺序
2. 事务边界 - 测试事务行为
3. 事件发布 - 测试领域事件发布
4. Mock 依赖 - Mock Repository 和外部服务

---

## 测试覆盖率要求

领域层：
- 行覆盖率 >= 90%
- 分支覆盖率 >= 85%
- 函数覆盖率 >= 95%

应用层：
- 行覆盖率 >= 80%
- 分支覆盖率 >= 75%
- 函数覆盖率 >= 85%

---

## 检查清单

值对象测试：
- [ ] 构造函数校验测试
- [ ] 相等性测试
- [ ] 不可变性测试
- [ ] 业务方法测试

聚合测试：
- [ ] 创建测试
- [ ] 状态变更测试
- [ ] 业务规则测试
- [ ] 领域事件测试

领域服务测试：
- [ ] 正常流程测试
- [ ] 边界条件测试
- [ ] 异常情况测试

