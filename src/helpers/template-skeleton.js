export const cardTemplateSkeleton = `
<div class="container-tonder-skeleton">
  <div class="skeleton-loader"></div>
  <div class="skeleton-loader"></div>
  <div class="collect-row-skeleton">
    <div class="skeleton-loader skeleton-loader-item"></div>
    <div class="skeleton-loader skeleton-loader-item"></div>
    <div class="skeleton-loader skeleton-loader-item"></div>
  </div>
</div>

<style>
.container-tonder-skeleton {
  background-color: #F9F9F9;
  margin: 0 auto !important;
  padding: 30px 10px 30px 10px;
  overflow: hidden;
  transition: max-height 0.5s ease-out;
  max-width: 600px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 45px;
}

.collect-row-skeleton {
  display: flex !important;
  justify-content: space-between !important;
  margin-left: 10px !important;
  margin-right: 10px !important;
  gap: 10px;
}
.skeleton-loader {
  height: 45px !important;
  border-radius: 8px;
  margin-top: 2px;
  margin-bottom: 4px;
  margin-left: 10px !important;
  margin-right: 10px !important;
  background-color: #e0e0e0;
  animation: pulse 1.5s infinite ease-in-out;
}
.skeleton-loader-item{
  width: 35%;
  margin: 0 !important;
}
@keyframes pulse {
  0% {
    background-color: #e0e0e0;
  }
  50% {
    background-color: #f0f0f0;
  }
  100% {
    background-color: #e0e0e0;
  }
}
</style>
`
