module.exports = function (grunt) {
  grunt.initConfig({
    babel: {
      options: {
        sourceMap: true,
        presets: ['babel-preset-es2015']
      },
      dist: {
        files: {
          'dist/dns.js': 'lib/dns.service.js'
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-babel');

  grunt.registerTask('build', 'babel');
  grunt.registerTask('default', 'build');
};
