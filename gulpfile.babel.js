import gulp from 'gulp';
import browserSync from 'browser-sync';

gulp.task('serve', () => {
    browserSync.init({
        server: {
            baseDir: './'
        }
    });

    gulp.watch(['*.html', '*.css', '*.js'], browserSync.reload);
});

gulp.task('default', []);