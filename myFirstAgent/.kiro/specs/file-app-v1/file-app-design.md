# file-app 设计文档

> Jira Issue: WCS-1636  
> 版本: 1.0  
> 日期: 2025-12-17  
> 关联需求: [file-app-requirements.md](./file-app-requirements.md)

## 1. 项目结构设计

### 1.1 DDD 分层架构

```
file-app/
├── src/main/java/com/item/file/
│   ├── FileApplication.java                    # Spring Boot 启动类
│   │
│   ├── rest/                                   # 表现层 (Presentation Layer)
│   │   └── FileController.java                 # REST API 控制器
│   │
│   ├── application/                            # 应用层 (Application Layer)
│   │   ├── dto/
│   │   │   ├── FileDto.java                    # 文件响应 DTO
│   │   │   ├── FileUploadCmd.java              # 上传命令对象
│   │   │   └── FileUpdateCmd.java              # 更新命令对象
│   │   ├── assembler/
│   │   │   └── FileAssembler.java              # MapStruct 对象转换器
│   │   └── service/
│   │       └── FileApplicationService.java     # 应用服务（业务编排）
│   │
│   ├── domain/                                 # 领域层 (Domain Layer)
│   │   ├── entity/
│   │   │   └── File.java                       # 文件实体
│   │   ├── repository/
│   │   │   └── FileRepository.java             # 仓储接口
│   │   ├── service/
│   │   │   └── FileService.java                # 领域服务
│   │   └── enums/
│   │       └── ErrorCode.java                  # 错误码枚举
│   │
│   └── infrastructure/                         # 基础设施层 (Infrastructure Layer)
│       ├── persistence/
│       │   ├── FileMapper.java                 # MyBatis Mapper 接口
│       │   └── FileRepositoryImpl.java         # 仓储实现
│       ├── common/
│       │   ├── BaseEntity.java                 # 基础实体类
│       │   └── BaseDto.java                    # 基础 DTO 类
│       └── config/
│           └── FileStorageConfig.java          # 文件存储配置
│
├── src/main/resources/
│   ├── application.yml                         # 应用配置
│   └── mapper/                                 # MyBatis XML (可选)
│       └── FileMapper.xml
│
└── build.gradle                                # Gradle 构建配置
```


### 1.2 层次职责

| 层次 | 职责 | 依赖方向 |
|------|------|----------|
| rest | HTTP 请求处理、参数校验、响应封装 | → application |
| application | 业务流程编排、DTO 转换、事务管理 | → domain |
| domain | 核心业务逻辑、实体、仓储接口 | 无外部依赖 |
| infrastructure | 技术实现（数据库、文件系统） | → domain |

---

## 2. API 接口规范

### 2.1 接口总览

| 方法 | 路径 | 功能 | 对应需求 |
|------|------|------|----------|
| POST | `/file/upload` | 单文件上传 | FR-001 |
| POST | `/file/upload-multiple` | 多文件上传 | FR-002 |
| GET | `/file/download/{fileId}` | 下载/预览 | FR-003 |
| GET | `/file/{fileId}` | 获取文件详情 | FR-004 |
| GET | `/files` | 批量获取详情 | FR-005 |
| PUT | `/file/{fileId}` | 更新元数据 | FR-006 |
| POST | `/file/{fileId}/content` | 更新文件内容 | FR-007 |
| PUT | `/files` | 批量更新 | FR-008 |
| DELETE | `/file/{fileId}` | 删除文件 | FR-009 |
| DELETE | `/files` | 批量删除 | FR-010 |

### 2.2 接口详细定义

#### 2.2.1 单文件上传

```
POST /file/upload
Content-Type: multipart/form-data

Request:
  - file: MultipartFile (必填)
  - directory: String (可选，子目录)

Response: 200 OK
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "a1b2c3d4e5f6...",
    "fileName": "example.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "filePath": "/data/uploads/a1b2c3d4-example.pdf",
    "createdTime": "2025-12-17T10:00:00",
    "createdBy": "admin"
  }
}
```

#### 2.2.2 多文件上传

```
POST /file/upload-multiple
Content-Type: multipart/form-data

Request:
  - files: MultipartFile[] (必填)
  - directory: String (可选)

Response: 200 OK
{
  "code": 0,
  "data": [
    { "id": "...", "fileName": "file1.pdf", ... },
    { "id": "...", "fileName": "file2.jpg", ... }
  ]
}
```

#### 2.2.3 文件下载/预览

```
GET /file/download/{fileId}?forceDownload=false

Response Headers:
  Content-Type: application/pdf (根据文件类型)
  Content-Disposition: inline; filename="example.pdf"
  // 或 attachment; filename="example.pdf" (forceDownload=true)

Response Body: 文件二进制流
```

#### 2.2.4 获取文件详情

```
GET /file/{fileId}

Response: 200 OK
{
  "code": 0,
  "data": {
    "id": "a1b2c3d4...",
    "fileName": "example.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024000,
    "filePath": "/data/uploads/a1b2c3d4-example.pdf",
    "createdTime": "2025-12-17T10:00:00",
    "createdBy": "admin",
    "updatedTime": "2025-12-17T10:00:00",
    "updatedBy": "admin"
  }
}
```

#### 2.2.5 批量获取文件详情

```
GET /files?fileIds=id1,id2,id3

Response: 200 OK
{
  "code": 0,
  "data": [
    { "id": "id1", "fileName": "file1.pdf", ... },
    { "id": "id2", "fileName": "file2.jpg", ... }
  ]
}
```


#### 2.2.6 更新文件元数据

```
PUT /file/{fileId}
Content-Type: application/json

Request Body:
{
  "fileName": "new-name.pdf"
}

Response: 200 OK
{
  "code": 0,
  "data": {
    "id": "a1b2c3d4...",
    "fileName": "new-name.pdf",
    ...
  }
}
```

#### 2.2.7 更新文件内容

```
POST /file/{fileId}/content
Content-Type: multipart/form-data

Request:
  - file: MultipartFile (必填，新文件内容)

Response: 200 OK
{
  "code": 0,
  "data": {
    "id": "a1b2c3d4...",
    "fileName": "updated-file.pdf",
    "fileType": "application/pdf",
    "fileSize": 2048000,
    ...
  }
}
```

#### 2.2.8 批量更新文件元数据

```
PUT /files
Content-Type: application/json

Request Body:
[
  { "id": "id1", "fileName": "new-name1.pdf" },
  { "id": "id2", "fileName": "new-name2.jpg" }
]

Response: 200 OK
{
  "code": 0,
  "data": [
    { "id": "id1", "fileName": "new-name1.pdf", ... },
    { "id": "id2", "fileName": "new-name2.jpg", ... }
  ]
}
```

#### 2.2.9 删除单个文件

```
DELETE /file/{fileId}

Response: 200 OK
{
  "code": 0,
  "message": "success"
}
```

#### 2.2.10 批量删除文件

```
DELETE /files?fileIds=id1,id2,id3

Response: 200 OK
{
  "code": 0,
  "message": "success"
}
```

---

## 3. 数据模型设计

### 3.1 实体类

#### File 实体

```java
@Data
@Builder
@TableName("doc_file")
public class File extends BaseEntity {
    
    @TableId(type = IdType.ASSIGN_ID)
    private String id;           // 主键，UUID 32位
    
    private String fileName;     // 原始文件名
    
    private String fileType;     // MIME 类型
    
    private Long fileSize;       // 文件大小（字节）
    
    private String filePath;     // 本地存储绝对路径
}
```

#### BaseEntity 基类

```java
@Data
public abstract class BaseEntity implements Serializable {
    
    @TableField(fill = FieldFill.INSERT)
    protected LocalDateTime createdTime;
    
    @TableField(fill = FieldFill.INSERT)
    protected String createdBy;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    protected LocalDateTime updatedTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    protected String updatedBy;
}
```

### 3.2 DTO 类

#### FileDto

```java
@Data
public class FileDto extends BaseDto {
    private String id;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String filePath;
    
    @JsonIgnore
    private Resource resource;  // 仅下载时使用，不序列化
}
```

#### FileUploadCmd

```java
@Getter
@AllArgsConstructor
public class FileUploadCmd {
    private MultipartFile file;      // 上传的文件
    private String directory;        // 可选的子目录
}
```

#### FileUpdateCmd

```java
@Data
public class FileUpdateCmd {
    private String id;               // 批量更新时使用
    private String fileName;         // 新文件名
}
```


### 3.3 对象转换器

```java
@Mapper(componentModel = "spring")
public abstract class FileAssembler {
    
    public abstract FileDto toFileDto(File file);
    
    public abstract List<FileDto> toFileDtoList(List<File> files);
    
    public abstract File toFile(FileDto fileDto);
}
```

---

## 4. 核心业务逻辑

### 4.1 文件上传流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      uploadFile(cmd)                            │
├─────────────────────────────────────────────────────────────────┤
│  1. 提取文件元信息                                               │
│     fileName = cmd.file.originalFilename                        │
│     fileType = cmd.file.contentType                             │
│     fileSize = cmd.file.size                                    │
│                                                                 │
│  2. 构建存储路径                                                 │
│     uploadPath = config.uploadDir                               │
│     IF cmd.directory IS NOT EMPTY:                              │
│         uploadPath = uploadPath + "/" + cmd.directory           │
│                                                                 │
│  3. 确保目录存在                                                 │
│     Files.createDirectories(uploadPath)                         │
│                                                                 │
│  4. 生成唯一文件名并存储                                         │
│     fileId = UUID.randomUUID().toString().replace("-", "")      │
│     targetPath = uploadPath + "/" + fileId + "-" + fileName     │
│     Files.copy(cmd.file.inputStream, targetPath)                │
│                                                                 │
│  5. 保存元数据到数据库                                           │
│     file = File.builder()                                       │
│         .fileName(fileName)                                     │
│         .fileType(fileType)                                     │
│         .fileSize(fileSize)                                     │
│         .filePath(targetPath.absolutePath)                      │
│         .build()                                                │
│     fileService.save(file)                                      │
│                                                                 │
│  6. 返回 FileDto                                                │
│     RETURN fileAssembler.toFileDto(file)                        │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 文件下载/预览流程

```
┌─────────────────────────────────────────────────────────────────┐
│              downloadFile(fileId, forceDownload)                │
├─────────────────────────────────────────────────────────────────┤
│  1. 查询文件记录                                                 │
│     file = fileService.getById(fileId)                          │
│     IF file IS NULL:                                            │
│         THROW FileNotFoundException(fileId)                     │
│                                                                 │
│  2. 加载文件资源                                                 │
│     path = Paths.get(file.filePath)                             │
│     resource = new UrlResource(path.toUri())                    │
│     IF NOT resource.exists() OR NOT resource.isReadable():      │
│         THROW FileNotReadableException(fileId)                  │
│                                                                 │
│  3. 设置响应头                                                   │
│     headers = new HttpHeaders()                                 │
│     headers.setContentType(MediaType.parseMediaType(fileType))  │
│                                                                 │
│  4. 决定下载还是预览                                             │
│     isPreviewable = fileType.startsWith("image/")               │
│                  OR fileType.startsWith("video/")               │
│     IF forceDownload OR NOT isPreviewable:                      │
│         disposition = ContentDisposition.attachment()           │
│     ELSE:                                                       │
│         disposition = ContentDisposition.inline()               │
│     headers.setContentDisposition(disposition.filename(...))    │
│                                                                 │
│  5. 返回响应                                                     │
│     RETURN ResponseEntity.ok().headers(headers).body(resource)  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 文件删除流程

```
┌─────────────────────────────────────────────────────────────────┐
│                      deleteFile(fileId)                         │
├─────────────────────────────────────────────────────────────────┤
│  1. 查询文件记录                                                 │
│     file = fileService.getById(fileId)                          │
│     IF file IS NULL:                                            │
│         THROW FileNotFoundException(fileId)                     │
│                                                                 │
│  2. 删除数据库记录                                               │
│     fileService.removeById(fileId)                              │
│                                                                 │
│  3. 删除物理文件                                                 │
│     TRY:                                                        │
│         Files.deleteIfExists(Paths.get(file.filePath))          │
│     CATCH IOException:                                          │
│         LOG.warn("Failed to delete: " + file.filePath)          │
│         // 不抛异常，数据库记录已删除即可                          │
└─────────────────────────────────────────────────────────────────┘
```


---

## 5. 配置项设计

### 5.1 application.yml

```yaml
server:
  port: 8080

spring:
  application:
    name: file-app
  
  # 文件上传配置
  servlet:
    multipart:
      enabled: true
      max-file-size: 100MB        # 单文件大小限制
      max-request-size: 500MB     # 请求总大小限制
  
  # 数据源配置
  datasource:
    url: jdbc:mysql://localhost:3306/file_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: ${DB_USERNAME:root}
    password: ${DB_PASSWORD:password}
    driver-class-name: com.mysql.cj.jdbc.Driver

# MyBatis-Plus 配置
mybatis-plus:
  mapper-locations: classpath:mapper/*.xml
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl  # 开发环境开启SQL日志
  global-config:
    db-config:
      id-type: assign_id
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

# 文件存储配置
file:
  upload-dir: /data/uploads       # 文件存储根目录
  # 可选：允许的文件类型白名单
  # allowed-types: image/*,application/pdf,application/msword
```

### 5.2 build.gradle

```groovy
plugins {
    id 'java'
    id 'org.springframework.boot' version '3.2.2'
    id 'io.spring.dependency-management' version '1.1.4'
}

group = 'com.item'
version = '1.0.0-SNAPSHOT'

java {
    sourceCompatibility = JavaVersion.VERSION_21
}

repositories {
    mavenCentral()
}

dependencies {
    // Spring Boot
    implementation 'org.springframework.boot:spring-boot-starter-web'
    implementation 'org.springframework.boot:spring-boot-starter-validation'
    
    // MyBatis-Plus
    implementation 'com.baomidou:mybatis-plus-spring-boot3-starter:3.5.5'
    
    // MySQL
    runtimeOnly 'com.mysql:mysql-connector-j'
    
    // Lombok
    compileOnly 'org.projectlombok:lombok:1.18.32'
    annotationProcessor 'org.projectlombok:lombok:1.18.32'
    
    // MapStruct
    implementation 'org.mapstruct:mapstruct:1.5.5.Final'
    annotationProcessor 'org.mapstruct:mapstruct-processor:1.5.5.Final'
    
    // Test
    testImplementation 'org.springframework.boot:spring-boot-starter-test'
}

tasks.withType(JavaCompile).configureEach {
    options.compilerArgs = [
        '-Amapstruct.defaultComponentModel=spring',
        '-Amapstruct.unmappedTargetPolicy=IGNORE',
        '-parameters'
    ]
}

test {
    useJUnitPlatform()
}
```

---

## 6. 数据库脚本

### 6.1 建库建表脚本

```sql
-- ============================================
-- file-app 数据库初始化脚本
-- Jira: WCS-1636
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS file_db 
    DEFAULT CHARACTER SET utf8mb4 
    COLLATE utf8mb4_general_ci;

USE file_db;

-- ============================================
-- 文件管理表
-- ============================================
DROP TABLE IF EXISTS `doc_file`;
CREATE TABLE `doc_file` (
    `id`          VARCHAR(32)   NOT NULL COMMENT '主键ID (UUID)',
    `fileName`    VARCHAR(100)  DEFAULT NULL COMMENT '原始文件名',
    `fileType`    VARCHAR(50)   DEFAULT NULL COMMENT 'MIME类型',
    `fileSize`    BIGINT        DEFAULT NULL COMMENT '文件大小(字节)',
    `filePath`    VARCHAR(500)  DEFAULT NULL COMMENT '本地存储路径',
    `createdBy`   VARCHAR(50)   DEFAULT NULL COMMENT '创建人',
    `createdTime` TIMESTAMP     DEFAULT NULL COMMENT '创建时间',
    `updatedBy`   VARCHAR(50)   DEFAULT NULL COMMENT '更新人',
    `updatedTime` TIMESTAMP     DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`) USING BTREE,
    INDEX `idx_fileName` (`fileName`),
    INDEX `idx_createdTime` (`createdTime`)
) ENGINE=InnoDB 
  DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_general_ci 
  COMMENT='文件管理表';
```

### 6.2 与 wcs-app 的差异

| 字段 | wcs-app | file-app | 说明 |
|------|---------|----------|------|
| source | VARCHAR(50) | **移除** | 仅本地存储，无需区分来源 |
| externalId | VARCHAR(50) | **移除** | 无外部存储，无需外部ID |


---

## 7. 错误码设计

### 7.1 错误码枚举

```java
@Getter
@AllArgsConstructor
public enum ErrorCode {
    
    // 文件相关错误 FILE_0xx
    FILE_NOT_FOUND("FILE_001", "文件不存在: {0}"),
    FILE_SAVE_FAILED("FILE_002", "文件保存失败"),
    FILE_UPDATE_FAILED("FILE_003", "文件更新失败: {0}"),
    FILE_DELETE_FAILED("FILE_004", "文件删除失败: {0}"),
    FILE_NOT_READABLE("FILE_005", "文件不可读: {0}"),
    FILE_STORAGE_ERROR("FILE_006", "文件存储异常: {0}"),
    FILE_TYPE_NOT_ALLOWED("FILE_007", "不允许的文件类型: {0}"),
    FILE_SIZE_EXCEEDED("FILE_008", "文件大小超出限制");
    
    private final String code;
    private final String message;
}
```

### 7.2 统一响应格式

```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class R<T> {
    private int code;           // 0=成功, 非0=失败
    private String message;     // 提示信息
    private T data;             // 响应数据
    
    public static <T> R<T> ok(T data) {
        return new R<>(0, "success", data);
    }
    
    public static <T> R<T> ok() {
        return new R<>(0, "success", null);
    }
    
    public static <T> R<T> fail(String code, String message) {
        return new R<>(Integer.parseInt(code.replaceAll("\\D", "")), message, null);
    }
}
```

---

## 8. 简化说明（相比 wcs-app）

### 8.1 移除的组件

| 组件 | 原因 |
|------|------|
| `FileSource` 枚举 | 仅支持 LOCAL，无需区分存储来源 |
| `externalId` 字段 | 无外部存储，无需外部系统文件ID |
| `ExternalFileAppService` | 无需调用外部文件服务 |
| `SpringUtil.getBean()` 动态获取 | 简化为直接注入 |

### 8.2 简化的逻辑

| 功能 | wcs-app | file-app |
|------|---------|----------|
| uploadFile | 判断 uploadType 选择存储方式 | 直接本地存储 |
| getFile | 判断 source 选择读取方式 | 直接读取本地文件 |
| updateFileContent | 判断 source 选择更新方式 | 直接覆盖本地文件 |

---

## 9. 后续扩展预留

如未来需要支持外部存储，可按以下方式扩展：

1. **恢复 FileSource 枚举**
   ```java
   public enum FileSource {
       LOCAL,      // 本地存储
       FILE_APP,   // 外部文件服务
       S3,         // AWS S3
       OSS         // 阿里云 OSS
   }
   ```

2. **添加 externalId 字段**
   ```sql
   ALTER TABLE doc_file ADD COLUMN source VARCHAR(50) AFTER filePath;
   ALTER TABLE doc_file ADD COLUMN externalId VARCHAR(50) AFTER source;
   ```

3. **引入策略模式**
   ```java
   public interface StorageStrategy {
       FileDto upload(MultipartFile file, String directory);
       Resource download(String fileId);
       void delete(String fileId);
   }
   
   @Component
   public class LocalStorageStrategy implements StorageStrategy { ... }
   
   @Component
   public class FileAppStorageStrategy implements StorageStrategy { ... }
   ```

---

## 附录 A: 参考实现

本设计参考了以下现有实现：

- `wcs-app/src/main/java/com/item/wcs/rest/file/FileController.java`
- `wcs-app/src/main/java/com/item/wcs/application/file/service/FileApplicationService.java`
- `wcs-app/src/main/java/com/item/wcs/domain/file/entity/File.java`
- `wcs-app/src/main/java/com/item/wcs/domain/file/service/FileService.java`
- `wcs-app/db-script/initialize/schema/wcs.sql` (doc_file 表定义)
