# MDM Item Domain E2E 测试报告 (2026-01-08)

## 范围
- 基于 `wms-lite-backend/.kiro/specs/mdm-item-domain/03-requirements.md` 与 `08-e2e-test-cases.md`
- UI E2E 采用 Playwright 手工步骤

## 环境
- 前端: http://localhost:5173/
- 后端: http://localhost:8084/
- 账号: tenantAdmin1 / 123456aa

## 计划用例（按模块）
1. 行业管理
- 新增行业（Req 1）
- 更新行业（Req 2）
- 删除行业（Req 3）
- 查询列表/详情（Req 4）
- 属性模板增删改与排序（Req 5）
2. 危险品管理
- 新增危险品（Req 6）
- 更新危险品（Req 7）
- 删除危险品（Req 8）
- 查询列表/详情（Req 9）
3. 物料管理
- 新增物料（Req 10）
- 更新物料（Req 11）
- 查询列表/详情 + 过滤（Req 12）
- 删除物料（Req 13）
- 启用/禁用物料（Req 14）
- 行业属性绑定（Req 15, 16）
- UOM 管理（Req 17）
- 托盘配置管理（Req 18）
- 组套管理（Req 19）
- 危险品关联（Req 20）
- 条码配置与查询（Req 21, 22）
- 序列号批次配置（Req 23, 24）
- 发运规则配置（Req 25）
- 导入单 + 映射 + 校验（Req 26-29）
4. 地址管理
- 新增地址
- 列表/搜索
- 详情查看
- 编辑
- 删除
5. 承运商管理
- 新增承运商
- 列表/搜索
- 详情查看
- 编辑
- 删除

## 执行结果

### 行业管理
- 新增行业（IND-E2E-02，含属性模板）- PASS
- 查询列表/详情 - PASS（可找到创建项）
- 更新行业名称/描述 - PASS
- 删除行业 - PASS
- 属性模板编辑/删除/排序 - NOT RUN（仅创建）

### 危险品管理
- 新增危险品（HAZ-E2E-02）- PASS
- 查询列表/搜索 - PASS
- 更新危险品（名称 + Packing Group）- PASS
- 删除危险品 - PASS

### 物料管理
- 新增物料（含 EAN + 行业属性 + UOM + 托盘配置，E2E-ITEM-004）- PASS
- 行业属性持久化（Color=Blue）- PASS
- UOM 管理（Each 基本单位 + Case 内包，qty/baseQty=12）- PASS
- 托盘配置（Standard Pallet, OUTBOUND, Case, TI=4, HI=5）- PASS
- 组套：在 KIT-001 添加组件（E2E-ITEM-004，qty 1，UOM Each）- PASS
- 启用/禁用物料（E2E-ITEM-004）- PASS
- 危险品关联（E2E-ITEM-004 -> HAZ-E2E-01）- PASS
- 条码查询 - NOT RUN
- 删除物料 - NOT RUN
- 导入单映射/校验 - NOT RUN（未找到入口）

### 地址管理
- 新增地址（E2E Address 01）- PASS
- 列表/搜索（按地址名称）- PASS
- 详情查看 - PASS
- 编辑 - PASS
- 删除 - PASS

### 承运商管理
- 新增承运商（CAR-E2E-02）- PASS
- 列表/搜索（按承运商编码）- PASS
- 详情查看 - PASS
- 编辑 - PASS
- 删除 - PASS

## 回归修复点
- 行业列表统计字段（Property Template Count / Related Item Count）- PASS
- 危险品列表统计字段（Related Item Count）- PASS
- 物料列表行业名称/编码 - PASS
- 地址列表按名称检索 - PASS
- 承运商列表按编码检索 - PASS

## 问题与观察
1. 行业编辑返回列表时出现错误 toast: "Invalid parameter: {}"（401）
   [处理结果] 已调整属性模板保存逻辑（编辑时分离新增/更新/删除），回归通过
2. 危险品删除首次返回 401（session 过期），重新登录后成功
   [处理结果] 需确认是否为会话过期导致，未见稳定复现路径
3. 组件物料未配置 UOM 时，组套 UOM 选择不可用（需要数据配置支持）
   [处理结果] 属于数据配置问题，需先补齐物料 UOM 配置
4. 承运商删除时控制台提示 antd modal static function 警告（不影响功能）
   [处理结果] 前端框架告警，未影响功能，需统一后续处理方案

## 测试数据
- 行业: IND-E2E-02（属性模板 Color: SELECT, required）
- 危险品: HAZ-E2E-02（Class 3, UN2026, Packing Group III -> 更新为 II）
- 物料: E2E-ITEM-004, KIT-001
- 组套组件: KIT-001 包含 E2E-ITEM-004（qty 1, UOM Each）
- 危险品关联: E2E-ITEM-004 关联 HAZ-E2E-01
- 地址: E2E Address 01（tags: warehouse, primary）
- 承运商: CAR-E2E-02
