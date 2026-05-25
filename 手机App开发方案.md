# 学生成长管理系统 - 手机App开发方案

## 方案选择：Flutter（推荐）

### 为什么选择Flutter？

| 特性 | Flutter | React Native | PWA |
|------|---------|--------------|-----|
| 性能 | ⭐⭐⭐ 接近原生 | ⭐⭐☆ 良好 | ⭐☆☆ 一般 |
| 开发成本 | ⭐⭐☆ 中等 | ⭐⭐☆ 中等 | ⭐⭐⭐ 最低 |
| 原生功能 | ⭐⭐⭐ 完整支持 | ⭐⭐☆ 较好 | ⭐☆☆ 有限 |
| 离线能力 | ⭐⭐⭐ 强 | ⭐⭐☆ 较好 | ⭐⭐☆ 一般 |
| 发布商店 | ⭐⭐⭐ 支持 | ⭐⭐⭐ 支持 | ⭐☆☆ 不支持 |
| 维护成本 | ⭐⭐⭐ 一套代码 | ⭐⭐☆ 较好 | ⭐⭐⭐ 最低 |

**结论**：Flutter是最佳选择，因为：
1. 一套代码同时生成iOS和Android App
2. 性能接近原生，用户体验好
3. 可以调用相机、通知等原生功能
4. 可以发布到App Store和Google Play
5. 热重载开发效率高

---

## Flutter项目结构

```
student_growth_app/
├── android/                    # Android原生配置
├── ios/                        # iOS原生配置
├── lib/
│   ├── main.dart               # 应用入口
│   ├── app.dart                # 应用配置（路由、主题）
│   ├── models/                 # 数据模型
│   │   ├── student.dart
│   │   ├── lesson.dart
│   │   ├── knowledge_point.dart
│   │   └── material.dart
│   ├── services/               # 服务层
│   │   ├── feishu_api.dart     # 飞书API封装
│   │   ├── glm_api.dart        # GLM-4-Flash AI服务
│   │   ├── storage_service.dart # 本地存储
│   │   └── notification_service.dart # 通知服务
│   ├── screens/                # 页面
│   │   ├── login_screen.dart   # 登录页
│   │   ├── home_screen.dart    # 首页
│   │   ├── students/
│   │   │   ├── student_list_screen.dart
│   │   │   ├── student_detail_screen.dart
│   │   │   └── student_report_screen.dart
│   │   ├── lessons/
│   │   │   ├── lesson_list_screen.dart
│   │   │   ├── lesson_record_screen.dart
│   │   │   └── ai_lesson_screen.dart
│   │   ├── knowledge/
│   │   │   └── knowledge_list_screen.dart
│   │   ├── materials/
│   │   │   └── material_list_screen.dart
│   │   └── settings/
│   │       └── settings_screen.dart
│   ├── widgets/                # 可复用组件
│   │   ├── student_card.dart
│   │   ├── lesson_card.dart
│   │   ├── radar_chart.dart
│   │   ├── growth_chart.dart
│   │   └── photo_picker.dart
│   ├── providers/              # 状态管理（Riverpod）
│   │   ├── auth_provider.dart
│   │   ├── student_provider.dart
│   │   └── lesson_provider.dart
│   └── utils/                  # 工具类
│       ├── constants.dart
│       ├── helpers.dart
│       └── pdf_generator.dart
├── assets/                     # 静态资源
│   ├── images/
│   └── fonts/
├── pubspec.yaml                # 依赖配置
└── test/                       # 测试文件
```

---

## 核心依赖

```yaml
# pubspec.yaml
name: student_growth_app
description: 学生成长管理系统 - 手机App

publish_to: 'none'

version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  
  # 状态管理
  flutter_riverpod: ^2.4.0
  
  # 网络请求
  dio: ^5.3.0
  
  # 本地存储
  shared_preferences: ^2.2.0
  sqflite: ^2.3.0
  path_provider: ^2.1.0
  
  # UI组件
  flutter_screenutil: ^5.9.0
  flutter_slidable: ^3.0.0
  shimmer: ^3.0.0
  flutter_staggered_grid_view: ^0.7.0
  
  # 图表
  fl_chart: ^0.65.0
  
  # 图片处理
  image_picker: ^1.0.0
  image_cropper: ^5.0.0
  cached_network_image: ^3.3.0
  
  # PDF生成
  pdf: ^3.10.0
  printing: ^5.11.0
  
  # 通知
  flutter_local_notifications: ^16.0.0
  
  # 权限管理
  permission_handler: ^11.0.0
  
  # 日期时间
  intl: ^0.18.0
  
  # 其他
  url_launcher: ^6.1.0
  share_plus: ^7.1.0
  package_info_plus: ^5.0.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  assets:
    - assets/images/
```

---

## 核心功能实现

### 1. 飞书API服务（feishu_api.dart）

```dart
import 'package:dio/dio.dart';

class FeishuApiService {
  final Dio _dio = Dio();
  String? _accessToken;
  DateTime? _tokenExpireTime;
  
  final String appId;
  final String appSecret;
  final String baseToken;
  
  FeishuApiService({
    required this.appId,
    required this.appSecret,
    required this.baseToken,
  }) {
    _dio.options.baseUrl = 'https://open.feishu.cn/open-apis';
    _dio.options.headers = {
      'Content-Type': 'application/json',
    };
  }
  
  // 获取访问令牌
  Future<String> _getAccessToken() async {
    if (_accessToken != null && 
        _tokenExpireTime != null && 
        DateTime.now().isBefore(_tokenExpireTime!.subtract(Duration(minutes: 5)))) {
      return _accessToken!;
    }
    
    final response = await _dio.post(
      '/auth/v3/tenant_access_token/internal',
      data: {
        'app_id': appId,
        'app_secret': appSecret,
      },
    );
    
    if (response.data['code'] == 0) {
      _accessToken = response.data['tenant_access_token'];
      _tokenExpireTime = DateTime.now().add(
        Duration(seconds: response.data['expire']),
      );
      return _accessToken!;
    } else {
      throw Exception('获取token失败: ${response.data['msg']}');
    }
  }
  
  // 基础请求
  Future<Map<String, dynamic>> _request(
    String method,
    String endpoint, {
    Map<String, dynamic>? data,
    Map<String, dynamic>? queryParameters,
  }) async {
    final token = await _getAccessToken();
    
    final response = await _dio.request(
      '/bitable/v1/apps/$baseToken$endpoint',
      options: Options(
        method: method,
        headers: {'Authorization': 'Bearer $token'},
      ),
      data: data,
      queryParameters: queryParameters,
    );
    
    return response.data;
  }
  
  // CRUD操作
  Future<List<Map<String, dynamic>>> listRecords(
    String tableId, {
    int pageSize = 500,
    String? filter,
  }) async {
    final response = await _request(
      'GET',
      '/tables/$tableId/records',
      queryParameters: {
        'page_size': pageSize,
        if (filter != null) 'filter': filter,
      },
    );
    
    return List<Map<String, dynamic>>.from(
      response['data']?['items'] ?? [],
    );
  }
  
  Future<Map<String, dynamic>> createRecord(
    String tableId,
    Map<String, dynamic> fields,
  ) async {
    return _request(
      'POST',
      '/tables/$tableId/records',
      data: {'fields': fields},
    );
  }
  
  Future<Map<String, dynamic>> updateRecord(
    String tableId,
    String recordId,
    Map<String, dynamic> fields,
  ) async {
    return _request(
      'PUT',
      '/tables/$tableId/records/$recordId',
      data: {'fields': fields},
    );
  }
  
  Future<void> deleteRecord(String tableId, String recordId) async {
    await _request('DELETE', '/tables/$tableId/records/$recordId');
  }
}
```

### 2. GLM-4-Flash AI服务（glm_api.dart）

```dart
import 'package:dio/dio.dart';

class GmlApiService {
  final Dio _dio = Dio();
  final String apiKey;
  
  GmlApiService({required this.apiKey}) {
    _dio.options.baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $apiKey',
    };
  }
  
  // AI识别课堂照片
  Future<Map<String, dynamic>> recognizeLessonImage(String base64Image) async {
    final response = await _dio.post('/chat/completions', data: {
      'model': 'glm-4-flash',
      'messages': [
        {
          'role': 'user',
          'content': [
            {
              'type': 'text',
              'text': '''请分析这张课堂照片，识别板书或练习内容，提取以下信息：
1. 课程主题（如：二次函数图像与性质）
2. 科目（数学/物理/化学/生物）
3. 涉及的知识点列表
4. 课堂情况简要描述
5. 学生表现评分（1-5分）

请以JSON格式返回：
{
  "topic": "课程主题",
  "subject": "科目",
  "knowledgePoints": ["知识点1", "知识点2"],
  "notes": "课堂情况描述",
  "performance": 4
}''',
            },
            {
              'type': 'image_url',
              'image_url': {'url': 'data:image/jpeg;base64,$base64Image'},
            },
          ],
        },
      ],
      'max_tokens': 1000,
    });
    
    final content = response.data['choices']?[0]?['message']?['content'] ?? '{}';
    // 解析JSON...
    return _parseJsonFromText(content);
  }
  
  // AI生成评语
  Future<String> generateComment({
    required String studentName,
    required String subject,
    required List<double> recentScores,
    required List<String> knowledgePoints,
    required List<String> improvements,
    required List<String> weaknesses,
  }) async {
    final avgScore = recentScores.isEmpty
        ? '暂无'
        : (recentScores.reduce((a, b) => a + b) / recentScores.length).toStringAsFixed(1);
    
    final response = await _dio.post('/chat/completions', data: {
      'model': 'glm-4-flash',
      'messages': [
        {
          'role': 'system',
          'content': '你是一名有经验的家教老师，善于鼓励学生，评语真诚具体。',
        },
        {
          'role': 'user',
          'content': '''请作为一名$subject老师，为学生$studentName生成一份150-200字的学习评语。

学生信息：
- 最近${recentScores.length}次课堂表现评分：${recentScores.join(' / ')} (满分5分)
- 平均评分：$avgScore
- 已掌握的知识点：${knowledgePoints.join('、')}
- 有进步的方面：${improvements.join('、')}
- 需要加强的方面：${weaknesses.join('、')}

要求：
1. 语言亲切，鼓励为主
2. 肯定学生的努力和进步
3. 指出具体需要改进的地方
4. 给出具体的建议
5. 150-200字左右

请直接输出评语内容，不要其他格式。''',
        },
      ],
      'temperature': 0.8,
      'max_tokens': 500,
    });
    
    return response.data['choices']?[0]?['message']?['content']?.trim() ?? '';
  }
  
  Map<String, dynamic> _parseJsonFromText(String text) {
    // 从文本中提取JSON...
    final jsonMatch = RegExp(r'\{[\s\S]*\}').firstMatch(text);
    if (jsonMatch != null) {
      // 解析JSON...
    }
    return {};
  }
}
```

### 3. 本地存储服务（storage_service.dart）

```dart
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class StorageService {
  static Database? _database;
  static SharedPreferences? _prefs;
  
  // 初始化
  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _database = await openDatabase(
      join(await getDatabasesPath(), 'student_growth.db'),
      version: 1,
      onCreate: (db, version) async {
        // 创建本地缓存表
        await db.execute('''
          CREATE TABLE students_cache (
            record_id TEXT PRIMARY KEY,
            data TEXT,
            updated_at INTEGER
          )
        ''');
        await db.execute('''
          CREATE TABLE lessons_cache (
            record_id TEXT PRIMARY KEY,
            data TEXT,
            updated_at INTEGER
          )
        ''');
      },
    );
  }
  
  // 保存配置
  static Future<void> saveConfig(Map<String, String> config) async {
    await _prefs?.setString('feishu_app_id', config['app_id'] ?? '');
    await _prefs?.setString('feishu_app_secret', config['app_secret'] ?? '');
    await _prefs?.setString('feishu_base_token', config['base_token'] ?? '');
    await _prefs?.setString('glm_api_key', config['glm_api_key'] ?? '');
    await _prefs?.setString('admin_password', config['admin_password'] ?? '');
  }
  
  // 读取配置
  static Map<String, String> getConfig() {
    return {
      'app_id': _prefs?.getString('feishu_app_id') ?? '',
      'app_secret': _prefs?.getString('feishu_app_secret') ?? '',
      'base_token': _prefs?.getString('feishu_base_token') ?? '',
      'glm_api_key': _prefs?.getString('glm_api_key') ?? '',
      'admin_password': _prefs?.getString('admin_password') ?? '',
    };
  }
  
  // 缓存数据
  static Future<void> cacheData(String table, String recordId, String data) async {
    await _database?.insert(
      '${table}_cache',
      {
        'record_id': recordId,
        'data': data,
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }
  
  // 读取缓存
  static Future<List<Map<String, dynamic>>> getCachedData(String table) async {
    return _database?.query('${table}_cache') ?? [];
  }
}
```

---

## UI设计要点

### 首页（Dashboard）

```dart
class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('学生成长管理'),
        actions: [
          IconButton(
            icon: Icon(Icons.notifications),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 统计卡片
            _buildStatsCards(),
            // 快捷操作
            _buildQuickActions(),
            // 最近课程
            _buildRecentLessons(),
            // 待办提醒
            _buildTodoList(),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddLessonSheet(context),
        child: Icon(Icons.add),
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: '首页'),
          BottomNavigationBarItem(icon: Icon(Icons.people), label: '学生'),
          BottomNavigationBarItem(icon: Icon(Icons.book), label: '课程'),
          BottomNavigationBarItem(icon: Icon(Icons.settings), label: '设置'),
        ],
      ),
    );
  }
}
```

### 学生列表页

```dart
class StudentListScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('学生管理'),
        actions: [
          IconButton(
            icon: Icon(Icons.search),
            onPressed: () => _showSearch(context),
          ),
          IconButton(
            icon: Icon(Icons.filter_list),
            onPressed: () => _showFilter(context),
          ),
        ],
      ),
      body: Consumer(
        builder: (context, ref, child) {
          final students = ref.watch(studentListProvider);
          return students.when(
            data: (list) => ListView.builder(
              itemCount: list.length,
              itemBuilder: (context, index) {
                final student = list[index];
                return StudentCard(
                  student: student,
                  onTap: () => _navigateToDetail(context, student),
                );
              },
            ),
            loading: () => Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(child: Text('加载失败: $err')),
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddStudentDialog(context),
        icon: Icon(Icons.person_add),
        label: Text('添加学生'),
      ),
    );
  }
}
```

### AI课堂记录页

```dart
class AiLessonScreen extends StatefulWidget {
  @override
  _AiLessonScreenState createState() => _AiLessonScreenState();
}

class _AiLessonScreenState extends State<AiLessonScreen> {
  File? _selectedImage;
  bool _isAnalyzing = false;
  Map<String, dynamic>? _aiResult;
  
  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.camera);
    if (image != null) {
      setState(() => _selectedImage = File(image.path));
    }
  }
  
  Future<void> _analyzeImage() async {
    if (_selectedImage == null) return;
    
    setState(() => _isAnalyzing = true);
    
    try {
      final bytes = await _selectedImage!.readAsBytes();
      final base64 = base64Encode(bytes);
      
      final result = await ref.read(glmApiProvider).recognizeLessonImage(base64);
      
      setState(() {
        _aiResult = result;
        _isAnalyzing = false;
      });
    } catch (e) {
      setState(() => _isAnalyzing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('识别失败: $e')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('AI智能记录')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 照片选择
            _buildPhotoSection(),
            SizedBox(height: 24),
            // 识别按钮
            if (_selectedImage != null && _aiResult == null)
              ElevatedButton.icon(
                onPressed: _isAnalyzing ? null : _analyzeImage,
                icon: _isAnalyzing
                    ? SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(Icons.auto_awesome),
                label: Text(_isAnalyzing ? '识别中...' : 'AI识别'),
              ),
            // 识别结果
            if (_aiResult != null) _buildResultSection(),
            // 保存按钮
            if (_aiResult != null)
              ElevatedButton(
                onPressed: _saveLesson,
                child: Text('保存课程记录'),
              ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildPhotoSection() {
    return GestureDetector(
      onTap: _pickImage,
      child: Container(
        width: double.infinity,
        height: 200,
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey[300]!),
        ),
        child: _selectedImage != null
            ? ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(_selectedImage!, fit: BoxFit.cover),
              )
            : Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.camera_alt, size: 48, color: Colors.grey[400]),
                  SizedBox(height: 8),
                  Text('点击拍摄课堂照片', style: TextStyle(color: Colors.grey[600])),
                ],
              ),
      ),
    );
  }
  
  Widget _buildResultSection() {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('识别结果', style: Theme.of(context).textTheme.titleMedium),
            SizedBox(height: 16),
            _buildResultItem('课程主题', _aiResult!['topic']),
            _buildResultItem('科目', _aiResult!['subject']),
            _buildResultItem('评分', '${_aiResult!['performance']}/5'),
            _buildResultItem('知识点', (_aiResult!['knowledgePoints'] as List).join('、')),
            _buildResultItem('课堂情况', _aiResult!['notes']),
          ],
        ),
      ),
    );
  }
  
  Widget _buildResultItem(String label, String value) {
    return Padding(
      padding: EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('$label: ', style: TextStyle(fontWeight: FontWeight.bold)),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
  
  void _saveLesson() {
    // 保存到飞书Base...
  }
}
```

---

## 开发步骤

### 1. 环境准备

```bash
# 安装Flutter SDK
# 访问 https://docs.flutter.dev/get-started/install

# 验证安装
flutter doctor

# 创建项目
flutter create student_growth_app
cd student_growth_app

# 添加依赖
flutter pub add flutter_riverpod dio shared_preferences sqflite path_provider \
  flutter_screenutil flutter_slidable shimmer fl_chart image_picker \
  image_cropper cached_network_image pdf printing flutter_local_notifications \
  permission_handler intl url_launcher share_plus package_info_plus
```

### 2. 配置平台权限

**Android**（android/app/src/main/AndroidManifest.xml）：
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

**iOS**（ios/Runner/Info.plist）：
```xml
<key>NSCameraUsageDescription</key>
<string>需要访问相机拍摄课堂照片</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>需要访问相册选择照片</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>需要保存照片到相册</string>
```

### 3. 实现核心功能

按上面的代码结构实现：
1. 数据模型（models/）
2. API服务（services/）
3. 状态管理（providers/）
4. UI页面（screens/）
5. 可复用组件（widgets/）

### 4. 构建发布

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

---

## 与Web版本的区别

| 功能 | Web版本 | App版本 |
|------|---------|---------|
| 访问方式 | 浏览器访问 | 安装到手机桌面 |
| 相机调用 | 受限 | 原生支持，体验好 |
| 离线使用 | 有限 | 完全支持（本地SQLite） |
| 推送通知 | 不支持 | 本地通知支持 |
| PDF导出 | 浏览器下载 | 保存到手机存储 |
| 数据同步 | 实时 | 支持离线编辑，联网同步 |
| 发布方式 | 部署到服务器 | 发布到应用商店 |

---

## 数据同步策略

App版本支持离线使用，需要实现数据同步：

1. **本地优先**：所有操作先写入本地SQLite
2. **后台同步**：联网时自动同步到飞书Base
3. **冲突处理**：以服务器数据为准，或提示用户选择
4. **增量同步**：只同步变更的数据，减少API调用

```dart
class SyncService {
  Future<void> syncToCloud() async {
    // 1. 获取本地未同步的数据
    final unsynced = await _getUnsyncedData();
    
    // 2. 批量上传到飞书
    for (final item in unsynced) {
      try {
        await _uploadToFeishu(item);
        await _markAsSynced(item['id']);
      } catch (e) {
        // 记录错误，下次重试
        await _markAsFailed(item['id'], e.toString());
      }
    }
  }
  
  Future<void> syncFromCloud() async {
    // 1. 获取服务器最新数据
    final serverData = await _fetchFromFeishu();
    
    // 2. 合并到本地
    for (final item in serverData) {
      await _saveToLocal(item);
    }
  }
}
```

---

## 总结

Flutter方案的优势：
1. **一套代码**，同时生成iOS和Android App
2. **原生体验**，流畅的动画和手势
3. **完整功能**，相机、通知、存储等原生API
4. **离线支持**，SQLite本地存储，随时可用
5. **应用商店**，可以发布到App Store和Google Play

开发周期预估：
- 基础功能：2-3周
- 完整功能：4-6周
- 测试优化：1-2周

建议先实现MVP版本（学生管理+课程记录+AI识别），再逐步添加其他功能。
