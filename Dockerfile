FROM nginx:alpine
COPY index.html /usr/share/nginx/html/index.html
COPY dashboard_supervisor.html /usr/share/nginx/html/dashboard_supervisor.html
COPY evaluacion_rrhh.html /usr/share/nginx/html/evaluacion_rrhh.html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
