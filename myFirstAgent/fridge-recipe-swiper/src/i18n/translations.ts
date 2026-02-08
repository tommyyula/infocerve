export const translations = {
  zh: {
    // Header
    appName: '冰箱食谱',

    // Upload Page
    uploadTitle: '上传冰箱照片',
    uploadSubtitle: '拍摄或上传你的冰箱食材照片',
    uploadHint: '点击上传或拖拽图片',
    uploadCameraHint: '拍摄冰箱照片',
    takePhoto: '拍摄照片',
    chooseFromGallery: '从相册选择',
    dragDropHint: '或拖拽图片到此处',
    selectImageFile: '请选择图片文件',
    recognizeButton: '识别食材',
    reuploadButton: '重新上传',

    // Loading Page
    recognizingText: '正在识别食材...',
    generatingText: '正在生成美味食谱...',
    aiWorking: 'AI 正在努力工作中',

    // Ingredients Page
    confirmIngredients: '确认食材',
    ingredientsSubtitle: '检查识别结果，可以添加或删除',
    addIngredientPlaceholder: '添加食材...',
    addButton: '添加',
    generateRecipes: '生成食谱',
    ingredientCount: '种食材',
    backToUpload: '返回上传',
    noIngredients: '未检测到食材',

    // Swipe Page
    swipeHint: '左滑跳过，右滑收藏',

    // Result Page
    resultTitle: '完成！',
    savedRecipes: '你收藏了 {count} 个食谱',
    startNewSearch: '开始新的搜索',

    // Favorites Page
    favoritesTitle: '我的收藏',
    totalRecipes: '共 {count} 个食谱',
    backButton: '返回',
    clearFavorites: '清空收藏',
    removeFavorite: '取消收藏',

    // Recipe Card
    minutes: '分钟',
    difficulty: {
      easy: '简单',
      medium: '中等',
      hard: '困难',
    },
    cookingSteps: '烹饪步骤',
    requiredIngredients: '所需食材',
    optional: '可选',
    allRecipesDone: '所有食谱都看完啦！',
    noFavorites: '没有收藏任何食谱',
    trySwipeRight: '试试多右滑几个吧！',

    // Errors
    errorRecognize: '食材识别失败',
    errorGenerate: '食谱生成失败',
    errorNetwork: '网络连接失败',
    retry: '重试',
  },

  en: {
    // Header
    appName: 'Fridge Recipe',

    // Upload Page
    uploadTitle: 'Upload Fridge Photo',
    uploadSubtitle: 'Take or upload a photo of your fridge ingredients',
    uploadHint: 'Click to upload or drag & drop',
    uploadCameraHint: 'Take a photo of your fridge',
    takePhoto: 'Take Photo',
    chooseFromGallery: 'Choose from Gallery',
    dragDropHint: 'Or drag & drop image here',
    selectImageFile: 'Please select an image file',
    recognizeButton: 'Recognize Ingredients',
    reuploadButton: 'Re-upload',

    // Loading Page
    recognizingText: 'Recognizing ingredients...',
    generatingText: 'Generating delicious recipes...',
    aiWorking: 'AI is working hard',

    // Ingredients Page
    confirmIngredients: 'Confirm Ingredients',
    ingredientsSubtitle: 'Review results, add or remove items',
    addIngredientPlaceholder: 'Add ingredient...',
    addButton: 'Add',
    generateRecipes: 'Generate Recipes',
    ingredientCount: 'ingredients',
    backToUpload: 'Back to Upload',
    noIngredients: 'No ingredients detected',

    // Swipe Page
    swipeHint: 'Swipe left to skip, right to save',

    // Result Page
    resultTitle: 'Done!',
    savedRecipes: 'You saved {count} recipes',
    startNewSearch: 'Start New Search',

    // Favorites Page
    favoritesTitle: 'My Favorites',
    totalRecipes: '{count} recipes total',
    backButton: 'Back',
    clearFavorites: 'Clear All',
    removeFavorite: 'Remove',

    // Recipe Card
    minutes: 'min',
    difficulty: {
      easy: 'Easy',
      medium: 'Medium',
      hard: 'Hard',
    },
    cookingSteps: 'Cooking Steps',
    requiredIngredients: 'Required Ingredients',
    optional: 'optional',
    allRecipesDone: 'All recipes viewed!',
    noFavorites: 'No favorites yet',
    trySwipeRight: 'Try swiping right on some recipes!',

    // Errors
    errorRecognize: 'Failed to recognize ingredients',
    errorGenerate: 'Failed to generate recipes',
    errorNetwork: 'Network connection failed',
    retry: 'Retry',
  },
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.zh;
