pipeline {

    agent any

    environment {
        OSS_ACCESS_KEY_ID     = credentials('oss-id')
        OSS_ACCESS_KEY_SECRET = credentials('oss-secret')
    }

    stages {
        stage("build") {
            steps {
                sh "yarn install --ignore-optional --registry https://registry.npm.taobao.org/"
                sh "yarn build"
            }
        }

        stage("build image") {
            when {
                expression {return  (env.BRANCH_NAME == 'master' ||  env.BRANCH_NAME == 'develop' ||  env.BRANCH_NAME == 'release')}
            }
            steps {
                sh "yarn docker:build"
            }
        }

        stage("push latest version image") {
            when {
                branch 'develop'
            }
            steps {
                sh "yarn docker:push-latest"
            }
        }


        stage("push release version image") {
            when {
                anyOf { branch 'master'; branch 'release' }
            }
            steps {
                sh "yarn docker:push-release"
            }
        }

        stage("build latest onpremise image") {
            when {
                anyOf { branch 'slwd'; }
            }
            steps {
                sh "yarn docker:build"
            }
        }
    }

    post {
        always {
             deleteDir()
        }
    }
}
