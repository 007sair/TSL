@echo off
echo -------------------
echo �˽ű����ڴ�Ŀ¼�½����ļ��滻
echo ȷ�������
echo -------------------
pause
copy /y %~dp0spritesmith\spritesheet-templates.js %~dp0node_modules\gulp.spritesmith\node_modules\spritesheet-templates\lib\spritesheet-templates.js
echo copy: %~dp0spritesmith\spritesheet-templates.js
echo to: %~dp0node_modules\gulp.spritesmith\node_modules\spritesheet-templates\lib\spritesheet-templates.js
copy /y %~dp0spritesmith\templates\css.template.handlebars %~dp0node_modules\gulp.spritesmith\node_modules\spritesheet-templates\lib\templates\css.template.handlebars
echo copy: %~dp0spritesmith\templates\css.template.handlebars
echo to: %~dp0node_modules\gulp.spritesmith\node_modules\spritesheet-templates\lib\templates\css.template.handlebars
copy /y %~dp0spritesmith\templates\scss.template.handlebars %~dp0node_modules\gulp.spritesmith\node_modules\spritesheet-templates\lib\templates\scss.template.handlebars
echo copy: %~dp0spritesmith\templates\scss.template.handlebars
echo to: %~dp0node_modules\gulp.spritesmith\node_modules\spritesheet-templates\lib\templates\scss.template.handlebars

echo �滻���
pause