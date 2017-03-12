import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import sass from 'node-sass';
const $ = gulpLoadPlugins();

const dist = 'dist';

gulp.task('serve', ['map'], () => {
    browserSync.init({
        server: {
            baseDir: ['.tmp', './']
        }
    });

    gulp.watch(['*.html', '*.css', '*.js'], browserSync.reload);
    gulp.watch(['map.svg', 'map.sass'], ['map', browserSync.reload]);
});

// WARNING: Uses regex, please escape reserved characters
const idReplacements = {
    'id="RB33"': 'id="RB33_2"',
    'id="RB33_2_"': 'id="RB33"',
    'id="RE57"': 'id="RE57_2"',
    'id="RE57_1_"': 'id="RE57"',
    'id="RB91"': 'id="RB91_1"',
    'id="RB91_1_"': 'id="RB91"',
    'id="IC01"': 'id="IC01_1"',
    'id="IC01_1_"': 'id="IC01"',
    'font-family="\'Magra-Bold\'"': "font-family=\"'Magra'\" font-weight=\"700\""
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
                content = content.replace(new RegExp(from, 'g'), to);
            });
            return content;
        }))
        .pipe(gulp.dest('.tmp'))
        .pipe(gulp.dest(dist));
});

gulp.task('build', ['map'], () => {
    return gulp.src([
        'bower_components/**/*',
        'data/**/*',
        'index.html',
        'main.css',
        'app.js', 'modal.js',
        'images/**/*'
    ], { base: './' })
        .pipe(gulp.dest(dist));
});

gulp.task('default', ['build']);
