import gulp from 'gulp';
import browserSync from 'browser-sync';
import gulpLoadPlugins from 'gulp-load-plugins';
import sass from 'node-sass';
import ftp from 'vinyl-ftp';
import dotenv from 'dotenv';
import path from 'path';
const $ = gulpLoadPlugins();

dotenv.config({silent: true});
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

gulp.task('scripts', () => {
    return gulp.src(['app.js', 'modal.js'])
        .pipe($.babel())
        .pipe($.uglify())
        .pipe(gulp.dest(dist));
});

gulp.task('build', ['scripts', 'map'], () => {
    return gulp.src([
        'bower_components/**/*',
        'data/**/*',
        'index.html',
        'main.css',
        'images/**/*',
        'fonts/**/*'
    ], { base: './' })
        .pipe(gulp.dest(dist));
});

gulp.task('upload', ['build'], () => {
    const conn = ftp.create({
        host: process.env.FTP_HOST,
        user: process.env.FTP_USER,
        pass: process.env.FTP_PASS
    });

    return gulp.src(path.join(dist, '**/*'), { buffer: false })
        .pipe(conn.dest('/'))
        .pipe(conn.clean('/**', dist, { base: '/' }));
});

gulp.task('default', ['build']);
