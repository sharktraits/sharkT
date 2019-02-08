class Observation < ApplicationRecord
  belongs_to :user
  belongs_to :resource
  belongs_to :secondary_resource, class: 'Resource'
  belongs_to :species
  belongs_to :longhurst_province
  belongs_to :location
end