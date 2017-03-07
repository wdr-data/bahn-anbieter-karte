import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import sass from 'node-sass';
const $ = gulpLoadPlugins();

gulp.task('serve', ['map'], () => {
    browserSync.init({
        server: {
            baseDir: ['.tmp', './']
        }
    });

    gulp.watch(['*.html', '*.css', '*.js'], browserSync.reload);
    gulp.watch(['map.svg', 'map.sass'], ['map', browserSync.reload]);
});

const idReplacements = {
    'RB33': 'RB33_2',
    'RB33_2_': 'RB33',
    'RE57': 'RE57_2',
    'RE57_1_': 'RE57',
    'RB91': 'RB91_1',
    'RB91_1_': 'RB91'
};
gulp.task('map', () => {
    return gulp.src('map.svg')
        .pipe($.replace('</svg>', () => {
            const css = sass.renderSync({
                file: 'map.sass'
            }).css;
            return "<style>" + css + "</style></svg>";
        }))
        .pipe($.change(content => {
            Object.keys(idReplacements).forEach(from => {
                const to = idReplacements[from];
                content = content.replace('id="'+from+'"', 'id="' + to + '"');
            });
            return content;
        }))
        .pipe(gulp.dest('.tmp'));
});

gulp.task('default', ['map']);