module.exports = function(grunt) {
    grunt.initConfig({
        concat: {
            copyToUX: {
                src: ['../src/*.js', '../src/utility/*.js', '../src/*/*.js', '../src/*/*/*.js', '../src/payment/clip/*.js'],
                dest: '../ui.js'
            },
            copyToUXPreviewer: {
                src: ['../src/*.js', '../src/utility/*.js', '../src/*/*.js', '../src/*/*/*.js', '../src/payment/clip/*.js'],
                dest: 'C:/projects/products/mynextep/Development/NEXTEP.Gateway/Web/MenuManagement/Preview/UX/js/ui.js'
            }
        },
        uglify: {
            minUX: {
                src: '../ui.js',
                dest: '../ui.min.js'
            },
            minUXPreviewer: {
                src: '../ui.js',
                dest: 'C:/projects/products/mynextep/Development/NEXTEP.Gateway/Web/MenuManagement/Preview/UX/js/ui.min.js'
            }        
        },
        jshint: {
            beforeconcat: ['../src/*.js', '../src/utility/*.js', '../src/*/*.js', '../page/*.js', '../src/payment/clip/*.js']
        },
        watch: {
            scripts: {
                files: ['../src/*.js', '../src/utility/*.js', '../src/*/*.js', '../src/*/*/*.js', '../src/payment/clip/*.js'],
                tasks: ['concat', 'jshint', 'uglify']
            }
        }
    });
 
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'jshint', 'uglify']);
};